const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const companiesRouter = require('./routes/companies');
const uploadRouter = require('./routes/upload');

// 初始化数据库
require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 添加请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/companies', companiesRouter);
app.use('/api/upload', uploadRouter);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: '服务器运行正常' });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误详情:', error);

    // 如果是multer错误
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: '文件大小超过限制'
        });
    }

    // 如果是文件类型错误
    if (error.message.includes('Excel')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(500).json({
        success: false,
        message: '服务器内部错误: ' + error.message
    });
});

// 404处理
app.use((req, res) => {
    console.log(`404 - 未找到路径: ${req.url}`);
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api/health`);
});

module.exports = app;