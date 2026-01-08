require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 导入中间件
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 导入路由
const authRouter = require('./routes/auth');
const companiesRouter = require('./routes/companies');
const uploadRouter = require('./routes/upload');
const aiRouter = require('./routes/ai');

// 初始化数据库
require('./models/database');
require('./models/userModel'); // 初始化用户表

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 限流中间件
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 限制 100 个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS 配置
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body 解析中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志中间件
app.use(logger.requestLogger);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/ai', aiRouter); // 注意：前端代理会将 /api/ai 转发为 /ai

// 404 处理
app.use(notFoundHandler);

// 错误日志中间件
app.use(logger.errorLogger);

// 全局错误处理中间件
app.use(errorHandler);

module.exports = app;
