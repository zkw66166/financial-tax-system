const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // 后端API代理 - 所有 /api 请求都转发到本地后端服务器
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:3001',
            changeOrigin: true,
        })
    );
};
