require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// 启动服务器
const server = app.listen(PORT, () => {
    logger.info(`服务器运行在端口 ${PORT}`);
    logger.info(`API地址: http://localhost:${PORT}/api/health`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
const gracefulShutdown = () => {
    logger.info('正在关闭服务器...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });

    // 如果 10 秒后还没关闭，强制退出
    setTimeout(() => {
        logger.error('无法正常关闭服务器，强制退出');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 拒绝', { reason, promise });
    process.exit(1);
});
