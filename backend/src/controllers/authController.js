const UserModel = require('../models/userModel');
const AuthService = require('../services/authService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * 用户认证控制器
 */
class AuthController {
    /**
     * 用户注册
     */
    register = asyncHandler(async (req, res) => {
        const { username, email, password, userType, fullName, phone } = req.body;

        // 检查用户名是否已存在
        const existingUser = UserModel.findByUsername(username);
        if (existingUser) {
            throw new AppError('用户名已存在', 400);
        }

        // 检查邮箱是否已存在
        const existingEmail = UserModel.findByEmail(email);
        if (existingEmail) {
            throw new AppError('邮箱已被注册', 400);
        }

        // 加密密码
        const hashedPassword = await AuthService.hashPassword(password);

        // 创建用户
        const userId = UserModel.create({
            username,
            email,
            password: hashedPassword,
            userType,
            fullName,
            phone,
        });

        // 生成 token
        const token = AuthService.generateToken({
            id: userId,
            username,
            email,
            userType: userType || 'enterprise',
        });

        logger.info('User registered', { userId, username, email });

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: userId,
                    username,
                    email,
                    userType: userType || 'enterprise',
                    fullName,
                },
                token,
            },
        });
    });

    /**
     * 用户登录
     */
    login = asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        // 查找用户
        const user = UserModel.findByUsername(username);
        if (!user) {
            throw new AppError('用户名或密码错误', 401);
        }

        // 验证密码
        const isPasswordValid = await AuthService.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('用户名或密码错误', 401);
        }

        // 检查用户是否激活
        if (!user.is_active) {
            throw new AppError('账户已被禁用，请联系管理员', 403);
        }

        // 更新最后登录时间
        UserModel.updateLastLogin(user.id);

        // 生成 token
        const token = AuthService.generateToken({
            id: user.id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
        });

        logger.info('User logged in', { userId: user.id, username: user.username });

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    userType: user.user_type,
                    fullName: user.full_name,
                    phone: user.phone,
                    companyId: user.company_id,
                },
                token,
            },
        });
    });

    /**
     * 获取当前用户信息
     */
    getCurrentUser = asyncHandler(async (req, res) => {
        const user = UserModel.findById(req.user.id);

        if (!user) {
            throw new AppError('用户不存在', 404);
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                userType: user.user_type,
                fullName: user.full_name,
                phone: user.phone,
                companyId: user.company_id,
                lastLogin: user.last_login,
                createdAt: user.created_at,
            },
        });
    });

    /**
     * 更新用户信息
     */
    updateProfile = asyncHandler(async (req, res) => {
        const { fullName, phone, userType } = req.body;
        const userId = req.user.id;

        const updated = UserModel.update(userId, {
            fullName,
            phone,
            userType,
        });

        if (!updated) {
            throw new AppError('更新失败', 400);
        }

        const user = UserModel.findById(userId);

        logger.info('User profile updated', { userId });

        res.json({
            success: true,
            message: '信息更新成功',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                userType: user.user_type,
                fullName: user.full_name,
                phone: user.phone,
            },
        });
    });

    /**
     * 修改密码
     */
    changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = UserModel.findById(userId);
        if (!user) {
            throw new AppError('用户不存在', 404);
        }

        // 验证当前密码
        const isPasswordValid = await AuthService.comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new AppError('当前密码错误', 401);
        }

        // 加密新密码
        const hashedPassword = await AuthService.hashPassword(newPassword);

        // 更新密码
        const stmt = UserModel.db.db.prepare('UPDATE users SET password = ? WHERE id = ?');
        stmt.run(hashedPassword, userId);

        logger.info('User password changed', { userId });

        res.json({
            success: true,
            message: '密码修改成功',
        });
    });
}

module.exports = new AuthController();
