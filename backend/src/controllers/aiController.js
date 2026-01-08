/**
 * AI 聊天控制器
 */

const cozeService = require('../services/cozeService');

/**
 * 处理流式聊天请求
 */
exports.streamChat = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: '问题不能为空'
            });
        }

        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

        // 发送初始连接成功消息
        res.write('event: connected\n');
        res.write('data: {"status":"connected"}\n\n');
        if (res.flush) res.flush(); // 确保立即发送

        // 调用 Coze 服务进行流式响应
        // 注意: streamChat 使用回调,需要包装成 Promise 来保持连接
        console.log('[Controller] About to call streamChat for question:', question.trim());

        await new Promise((resolve, reject) => {
            cozeService.streamChat(
                question.trim(),
                // onContent - 接收到内容时的回调
                (content) => {
                    console.log('[Controller] Sending content to frontend:', content.substring(0, 50));
                    res.write('event: message\n');
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    if (res.flush) res.flush(); // 确保立即发送
                },
                // onComplete - 完成时的回调
                (success, error) => {
                    console.log('[Controller] Stream completed. Success:', success, 'Error:', error);
                    if (success) {
                        res.write('event: done\n');
                        res.write('data: {"status":"completed"}\n\n');
                    } else {
                        res.write('event: error\n');
                        res.write(`data: ${JSON.stringify({ error: error || '未获取到回答' })}\n\n`);
                    }
                    res.end();
                    resolve(); // 完成 Promise
                },
                // onError - 错误时的回调
                (error) => {
                    console.error('[Controller] Stream error:', error);
                    res.write('event: error\n');
                    res.write(`data: ${JSON.stringify({ error: error.message || '服务器错误' })}\n\n`);
                    res.end();
                    reject(error); // 拒绝 Promise
                }
            );
        });

        console.log('[Controller] streamChat Promise resolved, function ending...');

        // 处理客户端断开连接
        req.on('close', () => {
            res.end();
        });

    } catch (error) {
        console.error('AI 聊天错误:', error);

        // 如果响应头还没发送，返回 JSON 错误
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: '服务器内部错误',
                error: error.message
            });
        }

        // 如果已经开始 SSE 流，发送错误事件
        res.write('event: error\n');
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

/**
 * 健康检查
 */
exports.healthCheck = (req, res) => {
    res.json({
        success: true,
        message: 'AI 服务运行正常',
        provider: 'Coze',
        timestamp: new Date().toISOString()
    });
};
