const logger = require('../utils/logger');

/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 异步错误处理包装器
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 错误处理
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`接口不存在: ${req.originalUrl}`, 404);
    next(error);
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // 设置默认状态码
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // 记录错误日志
    if (error.statusCode >= 500) {
        logger.error('Server Error', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
        });
    } else {
        logger.warn('Client Error', {
            message: error.message,
            url: req.url,
            method: req.method,
            statusCode: error.statusCode,
        });
    }

    // Multer 文件上传错误
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new AppError('文件大小超过限制（最大 10MB）', 400);
    }

    // Multer 文件类型错误
    if (err.message && err.message.includes('Excel')) {
        error = new AppError(err.message, 400);
    }

    // 数据库错误
    if (err.code === 'SQLITE_CONSTRAINT') {
        error = new AppError('数据库约束错误：数据已存在或违反唯一性约束', 400);
    }

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('无效的认证令牌', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('认证令牌已过期', 401);
    }

    // 验证错误
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        error = new AppError(`数据验证失败: ${messages.join(', ')}`, 400);
    }

    // 开发环境返回详细错误信息
    if (process.env.NODE_ENV === 'development') {
        return res.status(error.statusCode).json({
            success: false,
            status: error.status,
            message: error.message,
            error: err,
            stack: error.stack,
        });
    }

    // 生产环境
    // 操作性错误：发送给客户端
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            success: false,
            status: error.status,
            message: error.message,
        });
    }

    // 编程错误或未知错误：不泄露错误详情
    logger.error('Unexpected Error', {
        message: error.message,
        stack: error.stack,
    });

    return res.status(500).json({
        success: false,
        status: 'error',
        message: '服务器内部错误',
    });
};

/**
 * 验证错误格式化
 */
const validationErrorFormatter = (errors) => {
    return errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
    }));
};

module.exports = {
    AppError,
    asyncHandler,
    notFoundHandler,
    errorHandler,
    validationErrorFormatter,
};
