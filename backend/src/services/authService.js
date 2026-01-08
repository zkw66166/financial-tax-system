const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

/**
 * 用户认证服务
 */
class AuthService {
    /**
     * 密码加密
     */
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * 密码验证
     */
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * 生成 JWT Token
     */
    static generateToken(payload, expiresIn = '7d') {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        return jwt.sign(payload, secret, { expiresIn });
    }

    /**
     * 验证 JWT Token
     */
    static verifyToken(token) {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            throw new AppError('无效的认证令牌', 401);
        }
    }

    /**
     * 从请求头获取 Token
     */
    static getTokenFromHeader(req) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        return authHeader.substring(7);
    }
}

module.exports = AuthService;
