import aiConfig from '../config/aiConfig.json';

/**
 * 调用AI API获取回答
 * @param {string} question - 用户提问
 * @returns {Promise<{answer: string, confidence: number, policies: string[]}>}
 */
export const getAIAnswer = async (question) => {
    const config = aiConfig.models[0]; // 使用第一个配置的模型

    try {
        const response = await fetch(`${config.apiBase}/chat/completions`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "Pro/zai-org/GLM-4.7",
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
    getAIAnswer
};

export default aiService;
