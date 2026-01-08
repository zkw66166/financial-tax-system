const AuthService = require('../services/authService');
const { AppError, asyncHandler } = require('./errorHandler');

/**
 * 认证中间件 - 验证用户是否已登录
 */
const authenticate = asyncHandler(async (req, res, next) => {
    // 获取 token
    const token = AuthService.getTokenFromHeader(req);

    if (!token) {
        throw new AppError('请先登录', 401);
    }

    // 验证 token
    const decoded = AuthService.verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        userType: decoded.userType,
    };

    next();
});

/**
 * 授权中间件 - 验证用户权限
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('请先登录', 401);
        }

        if (!allowedRoles.includes(req.user.userType)) {
            throw new AppError('您没有权限执行此操作', 403);
        }

        next();
    };
};

/**
 * 可选认证中间件 - 如果有 token 则验证，没有则继续
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    const token = AuthService.getTokenFromHeader(req);

    if (token) {
        try {
            const decoded = AuthService.verifyToken(token);
            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                userType: decoded.userType,
            };
        } catch (error) {
            // Token 无效，但不阻止请求继续
            req.user = null;
        }
    }

    next();
});

module.exports = {
    authenticate,
    authorize,
    optionalAuth,
};
