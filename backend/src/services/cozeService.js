/**
 * Coze AI 知识库服务
 * 基于 coze_chat.py 的实现逻辑
 */

const https = require('https');

class CozeService {
    constructor() {
        this.patToken = process.env.COZE_PAT_TOKEN;
        this.botId = process.env.COZE_BOT_ID;
        this.userId = process.env.COZE_USER_ID || '123';
        this.apiUrl = process.env.COZE_API_URL || 'https://api.coze.cn/v3/chat';
        this.timeout = parseInt(process.env.COZE_TIMEOUT || '180000', 10);

        // Debug logging
        console.log('Coze Service initialized:');
        console.log('- PAT Token:', this.patToken ? `${this.patToken.substring(0, 20)}...` : 'MISSING');
        console.log('- Bot ID:', this.botId || 'MISSING');
        console.log('- API URL:', this.apiUrl);
    }

    /**
     * 解析 SSE 行数据
     * @param {string} line - SSE 数据行
     * @returns {Object} { eventType, data }
     */
    parseSseLine(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) return { eventType: null, data: null };

        if (trimmedLine.startsWith('event:')) {
            return { eventType: trimmedLine.substring(6).trim(), data: null };
        }

        if (trimmedLine.startsWith('data:')) {
            try {
                const jsonData = JSON.parse(trimmedLine.substring(5).trim());
                return { eventType: null, data: jsonData };
            } catch (error) {
                return { eventType: null, data: null };
            }
        }

        return { eventType: null, data: null };
    }

    /**
     * 流式调用 Coze API
     * @param {string} question - 用户问题
     * @param {Function} onContent - 内容回调函数
     * @param {Function} onComplete - 完成回调函数
     * @param {Function} onError - 错误回调函数
     */
    async streamChat(question, onContent, onComplete, onError) {
        console.log('\n=== Coze API Call Started ===');
        console.log('Question:', question);
        console.log('Bot ID:', this.botId);
        console.log('API URL:', this.apiUrl);

        const url = new URL(this.apiUrl);

        const payload = JSON.stringify({
            bot_id: this.botId,
            user_id: this.userId,
            stream: true,
            auto_save_history: true,
            additional_messages: [
                {
                    role: 'user',
                    content: question,
                    content_type: 'text'
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        console.log('Payload:', payload);

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.patToken}`,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'text/event-stream',
                'User-Agent': 'Mozilla/5.0',
                'Content-Length': Buffer.byteLength(payload)
            },
            rejectUnauthorized: false // 对应 Python 的 verify=False
        };

        const req = https.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', JSON.stringify(res.headers));

            if (res.statusCode !== 200) {
                console.error('HTTP Error:', res.statusCode);
                onError(new Error(`HTTP错误：${res.statusCode}`));
                return;
            }

            let buffer = '';
            let currentEvent = null;
            let hasContent = false;

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                console.log('Received chunk:', chunk.substring(0, 200));
                buffer += chunk;
                const lines = buffer.split('\n');

                // 保留最后一个可能不完整的行
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        console.log('Processing line:', line);
                    }
                    const { eventType, data } = this.parseSseLine(line);

                    if (eventType) {
                        console.log('Event type:', eventType);
                        currentEvent = eventType;
                    }

                    if (data) {
                        console.log('Data received:', JSON.stringify(data));
                        console.log('Current event:', currentEvent);
                    }

                    if (data && currentEvent === 'conversation.message.delta') {
                        console.log('Delta data - role:', data.role, 'type:', data.type);
                        if (data.role === 'assistant' && data.type === 'answer') {
                            const content = data.content || '';
                            if (content) {
                                console.log('Content found:', content.substring(0, 50));
                                onContent(content);
                                hasContent = true;
                            }
                        }
                    }
                }
            });

            res.on('end', () => {
                console.log('Stream ended. Has content:', hasContent);
                if (hasContent) {
                    onComplete(true, '');
                } else {
                    console.error('No content received from Coze API');
                    onComplete(false, '未获取到回答');
                }
            });

            res.on('error', (error) => {
                onError(error);
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            onError(error);
        });

        req.on('timeout', () => {
            req.destroy();
            onError(new Error('请求超时'));
        });

        req.setTimeout(this.timeout);
        req.write(payload);
        req.end();
    }

    /**
     * 非流式调用 Coze API（用于测试或简单场景）
     * @param {string} question - 用户问题
     * @returns {Promise<string>} AI 回答
     */
    async chat(question) {
        return new Promise((resolve, reject) => {
            let fullAnswer = '';

            this.streamChat(
                question,
                (content) => {
                    fullAnswer += content;
                },
                (success, error) => {
                    if (success) {
                        resolve(fullAnswer);
                    } else {
                        reject(new Error(error || '未获取到回答'));
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
}

module.exports = new CozeService();
