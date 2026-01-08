const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // 后端API代理
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:3001',
            changeOrigin: true,
        })
    );

    // AI API代理
    app.use(
        '/api/ai',
        createProxyMiddleware({
            target: 'https://api.siliconflow.cn',
            changeOrigin: true,
            pathRewrite: {
                '^/api/ai': '/v1'
            },
            onProxyReq: (proxyReq, req, res) => {
                console.log('Proxying AI request to:', proxyReq.path);
            }
        })
    );
};
