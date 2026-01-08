import aiConfig from '../config/aiConfig.json';

/**
 * 获取当前配置的 AI 提供商
 */
const getCurrentProvider = () => {
    const defaultProvider = aiConfig.defaultProvider || 'coze';
    return aiConfig.models.find(m => m.provider === defaultProvider) || aiConfig.models[0];
};

/**
 * 调用 Coze AI 流式 API
 * @param {string} question - 用户提问
 * @param {Function} onContent - 内容回调函数
 * @param {Function} onComplete - 完成回调函数
 * @param {Function} onError - 错误回调函数
 * @returns {Function} 取消函数
 */
export const getAIAnswerStream = (question, onContent, onComplete, onError) => {
    const config = getCurrentProvider();

    if (!config.streaming) {
        // 如果不支持流式,回退到普通 API
        getAIAnswer(question)
            .then(result => {
                onContent(result.answer);
                onComplete(result);
            })
            .catch(onError);
        return () => { };
    }

    let eventSource = null;
    let fullAnswer = '';

    try {
        console.log('[Frontend] Starting fetch to:', `${config.apiBase}/chat`);
        console.log('[Frontend] Request body:', { question });

        // 使用 fetch 发送 POST 请求并处理 SSE
        fetch(`${config.apiBase}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        }).then(response => {
            console.log('[Frontend] Response received, status:', response.status);
            console.log('[Frontend] Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP错误：${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const processStream = () => {
                reader.read().then(({ done, value }) => {
                    console.log('[Frontend] Stream chunk received, done:', done, 'value length:', value?.length);

                    if (done) {
                        console.log('[Frontend] Stream ended. fullAnswer length:', fullAnswer.length);
                        if (fullAnswer) {
                            onComplete({
                                answer: fullAnswer,
                                confidence: 90,
                                policies: extractPolicies(fullAnswer)
                            });
                        } else {
                            onError(new Error('未获取到回答'));
                        }
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    let currentEvent = null;

                    for (const line of lines) {
                        console.log('[Frontend] Processing line:', line);

                        if (line.startsWith('event:')) {
                            currentEvent = line.substring(6).trim();
                            console.log('[Frontend] Event type:', currentEvent);
                        } else if (line.startsWith('data:')) {
                            try {
                                const data = JSON.parse(line.substring(5).trim());
                                console.log('[Frontend] Data received:', data);

                                if (currentEvent === 'error' || data.error) {
                                    onError(new Error(data.error || '服务器错误'));
                                    return;
                                } else if (currentEvent === 'done') {
                                    if (fullAnswer) {
                                        onComplete({
                                            answer: fullAnswer,
                                            confidence: 90,
                                            policies: extractPolicies(fullAnswer)
                                        });
                                    }
                                    return;
                                } else if (currentEvent === 'message' && data.content) {
                                    fullAnswer += data.content;
                                    onContent(data.content);
                                    console.log('[Frontend] Content added, total length:', fullAnswer.length);
                                }
                            } catch (e) {
                                console.warn('解析 SSE 数据失败:', e, 'Line:', line);
                            }
                        }
                    }

                    processStream();
                }).catch(error => {
                    onError(error);
                });
            };

            processStream();
        }).catch(error => {
            onError(error);
        });

    } catch (error) {
        console.error('AI API调用错误:', error);
        onError(error);
    }

    // 返回取消函数
    return () => {
        if (eventSource) {
            eventSource.close();
        }
    };
};

/**
 * 调用AI API获取回答（非流式，用于兼容）
 * @param {string} question - 用户提问
 * @returns {Promise<{answer: string, confidence: number, policies: string[]}>}
 */
export const getAIAnswer = async (question) => {
    const config = getCurrentProvider();

    // 如果是 Coze 且支持流式，使用流式 API
    if (config.streaming) {
        return new Promise((resolve, reject) => {
            let fullAnswer = '';
            getAIAnswerStream(
                question,
                (content) => { fullAnswer += content; },
                (result) => { resolve(result); },
                (error) => { reject(error); }
            );
        });
    }

    // SiliconFlow 非流式 API
    try {
        const response = await fetch(`${config.apiBase}/chat/completions`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一位专业的中国税务和财务顾问。请根据中国的税法和财务法规，为用户提供准确、专业的建议。如果问题涉及具体的税务处理，请引用相关的法律法规条款。回答要简洁明了，重点突出。'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                stream: false,
                max_tokens: 4096,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                frequency_penalty: 0.5,
                n: 1,
                response_format: {
                    type: "text"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API调用失败: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();

        // 提取回答内容
        const answer = data.choices?.[0]?.message?.content || '抱歉，无法生成回答';

        // 计算置信度（这里简化处理，可以根据实际需要调整）
        const confidence = 85; // 默认置信度

        return {
            answer,
            confidence,
            policies: extractPolicies(answer) // 提取政策法规
        };

    } catch (error) {
        console.error('AI API调用错误:', error);
        throw error;
    }
};

/**
 * 从回答中提取政策法规引用
 * @param {string} answer - AI回答内容
 * @returns {string[]} 政策法规数组
 */
const extractPolicies = (answer) => {
    const policies = [];

    // 匹配《...》格式的法规名称
    const policyRegex = /《([^》]+)》/g;
    let match;

    while ((match = policyRegex.exec(answer)) !== null) {
        if (!policies.includes(match[0])) {
            policies.push(match[0]);
        }
    }

    return policies.slice(0, 5); // 最多返回5个政策法规
};

const aiService = {
    getAIAnswer,
    getAIAnswerStream
};

export default aiService;
