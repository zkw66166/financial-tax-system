const db = require('../models/database');

/**
 * 活动日志服务
 * 负责记录和查询系统活动
 */

/**
 * 记录活动
 * @param {number} companyId - 企业ID
 * @param {number} userId - 用户ID
 * @param {string} activityType - 活动类型 (upload, report, analysis, etc.)
 * @param {string} description - 活动描述
 * @param {Object} metadata - 额外信息
 */
async function logActivity(companyId, userId, activityType, description, metadata = {}) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO activity_logs (company_id, user_id, activity_type, description, metadata)
            VALUES (?, ?, ?, ?, ?)
        `;

        const metadataJson = JSON.stringify(metadata);

        db.run(sql, [companyId, userId, activityType, description, metadataJson], function (err) {
            if (err) {
                console.error('记录活动失败:', err);
                reject(err);
            } else {
                console.log('活动记录成功，ID:', this.lastID);
                resolve({ id: this.lastID });
            }
        });
    });
}

/**
 * 获取最近活动
 * @param {number} companyId - 企业ID
 * @param {number} limit - 返回数量限制
 */
async function getRecentActivities(companyId, limit = 10) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                id,
                activity_type as activityType,
                description,
                created_at as createdAt,
                metadata
            FROM activity_logs
            WHERE company_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;

        db.all(sql, [companyId, limit], (err, rows) => {
            if (err) {
                console.error('查询最近活动失败:', err);
                reject(err);
            } else {
                // 格式化返回数据
                const activities = rows.map(row => ({
                    id: row.id,
                    activityType: row.activityType,
                    description: row.description,
                    createdAt: row.createdAt,
                    relativeTime: formatRelativeTime(row.createdAt),
                    metadata: row.metadata ? JSON.parse(row.metadata) : {}
                }));

                console.log('查询到', activities.length, '条活动记录');
                resolve(activities);
            }
        });
    });
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return `${Math.floor(diffDays / 30)}个月前`;
}

module.exports = {
    logActivity,
    getRecentActivities
};
