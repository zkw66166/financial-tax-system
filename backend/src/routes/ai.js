/**
 * AI 聊天路由
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * @route   POST /api/ai/chat
 * @desc    流式 AI 聊天
 * @access  Public (可根据需要添加认证中间件)
 */
router.post('/chat', aiController.streamChat);

/**
 * @route   GET /api/ai/health
 * @desc    AI 服务健康检查
 * @access  Public
 */
router.get('/health', aiController.healthCheck);

module.exports = router;
