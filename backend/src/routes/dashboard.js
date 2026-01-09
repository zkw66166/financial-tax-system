const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');
const activityService = require('../services/activityService');

/**
 * 获取企业Dashboard关键指标
 * GET /api/dashboard/metrics/:companyId
 */
router.get('/metrics/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log('获取Dashboard指标，企业ID:', companyId);

        const metrics = await dashboardService.getDashboardMetrics(parseInt(companyId));

        if (!metrics) {
            return res.json({
                success: true,
                data: null,
                message: '暂无数据'
            });
        }

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('获取Dashboard指标失败:', error);
        res.status(500).json({
            success: false,
            message: '获取Dashboard指标失败: ' + error.message
        });
    }
});

/**
 * 获取系统状态
 * GET /api/dashboard/system-status
 */
router.get('/system-status', async (req, res) => {
    try {
        console.log('获取系统状态');

        const status = await dashboardService.getSystemStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取系统状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取系统状态失败: ' + error.message
        });
    }
});

/**
 * 获取最近活动
 * GET /api/dashboard/recent-activities/:companyId
 */
router.get('/recent-activities/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        console.log('获取最近活动，企业ID:', companyId, '限制:', limit);

        const activities = await activityService.getRecentActivities(parseInt(companyId), limit);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('获取最近活动失败:', error);
        res.status(500).json({
            success: false,
            message: '获取最近活动失败: ' + error.message
        });
    }
});

module.exports = router;
