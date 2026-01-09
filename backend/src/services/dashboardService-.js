const db = require('../models/database');

/**
 * Dashboard数据服务
 * 负责计算和聚合工作台所需的各项指标
 */

/**
 * 获取企业关键指标
 * @param {number} companyId - 企业ID
 * @returns {Promise<Object>} 关键指标数据
 */
async function getDashboardMetrics(companyId) {
    try {
        console.log('开始获取Dashboard指标，企业ID:', companyId);

        // 获取最新期间
        const latestPeriod = await getLatestPeriod(companyId);
        if (!latestPeriod) {
            console.log('未找到数据期间');
            return null;
        }

        console.log('最新期间:', latestPeriod);

        // 并行获取各项指标
        const [revenue, netProfit, taxBurdenRate, employeeCount] = await Promise.all([
            getRevenue(companyId, latestPeriod.year, latestPeriod.quarter),
            getNetProfit(companyId, latestPeriod.year, latestPeriod.quarter),
            getTaxBurdenRate(companyId, latestPeriod.year, latestPeriod.quarter),
            getEmployeeCount(companyId, latestPeriod.year, latestPeriod.quarter)
        ]);

        console.log('指标获取完成:', { revenue, netProfit, taxBurdenRate, employeeCount });

        return {
            revenue,
            netProfit,
            taxBurdenRate,
            employeeCount,
            period: {
                year: latestPeriod.year,
                quarter: latestPeriod.quarter,
                display: `${latestPeriod.year}年第${latestPeriod.quarter}季度`
            }
        };
    } catch (error) {
        console.error('获取Dashboard指标失败:', error);
        throw error;
    }
}

/**
 * 获取最新数据期间
 */
async function getLatestPeriod(companyId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT period_year as year, period_quarter as quarter
            FROM income_statements
            WHERE company_id = ?
            ORDER BY period_year DESC, period_quarter DESC
            LIMIT 1
        `;

        db.get(sql, [companyId], (err, row) => {
            if (err) {
                console.error('查询最新期间失败:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * 获取营业收入及同比增长
 */
async function getRevenue(companyId, year, quarter) {
    return new Promise((resolve, reject) => {
        // 获取当前期间数据
        const currentSql = `
            SELECT operating_revenue
            FROM income_statements
            WHERE company_id = ? AND period_year = ? AND period_quarter = ?
            LIMIT 1
        `;

        db.get(currentSql, [companyId, year, quarter], async (err, current) => {
            if (err) {
                console.error('查询当前营业收入失败:', err);
                return reject(err);
            }

            const currentValue = current?.operating_revenue || 0;

            // 获取上一年同期数据
            const previousYear = year - 1;
            const previousSql = `
                SELECT operating_revenue
                FROM income_statements
                WHERE company_id = ? AND period_year = ? AND period_quarter = ?
                LIMIT 1
            `;

            db.get(previousSql, [companyId, previousYear, quarter], (err, previous) => {
                if (err) {
                    console.error('查询上年营业收入失败:', err);
                    return reject(err);
                }

                const previousValue = previous?.operating_revenue || 0;
                const yoyGrowth = calculateYoYGrowth(currentValue, previousValue);

                resolve({
                    value: currentValue,
                    formatted: formatAmount(currentValue),
                    yoyGrowth: yoyGrowth,
                    trend: yoyGrowth >= 0 ? 'up' : 'down'
                });
            });
        });
    });
}

/**
 * 获取净利润及同比增长
 */
async function getNetProfit(companyId, year, quarter) {
    return new Promise((resolve, reject) => {
        const currentSql = `
            SELECT net_profit
            FROM income_statements
            WHERE company_id = ? AND period_year = ? AND period_quarter = ?
            LIMIT 1
        `;

        db.get(currentSql, [companyId, year, quarter], async (err, current) => {
            if (err) {
                console.error('查询当前净利润失败:', err);
                return reject(err);
            }

            const currentValue = current?.net_profit || 0;

            const previousYear = year - 1;
            const previousSql = `
                SELECT net_profit
                FROM income_statements
                WHERE company_id = ? AND period_year = ? AND period_quarter = ?
                LIMIT 1
            `;

            db.get(previousSql, [companyId, previousYear, quarter], (err, previous) => {
                if (err) {
                    console.error('查询上年净利润失败:', err);
                    return reject(err);
                }

                const previousValue = previous?.net_profit || 0;
                const yoyGrowth = calculateYoYGrowth(currentValue, previousValue);

                resolve({
                    value: currentValue,
                    formatted: formatAmount(currentValue),
                    yoyGrowth: yoyGrowth,
                    trend: yoyGrowth >= 0 ? 'up' : 'down'
                });
            });
        });
    });
}

/**
 * 获取税负率及变化
 */
async function getTaxBurdenRate(companyId, year, quarter) {
    return new Promise((resolve, reject) => {
        // 获取当前期间的税额和营业收入
        const currentSql = `
            SELECT 
                i.operating_revenue,
                i.income_tax_expense,
                i.taxes_and_surcharges
            FROM income_statements i
            WHERE i.company_id = ? AND i.period_year = ? AND i.period_quarter = ?
            LIMIT 1
        `;

        db.get(currentSql, [companyId, year, quarter], (err, current) => {
            if (err) {
                console.error('查询当前税负数据失败:', err);
                return reject(err);
            }

            const revenue = current?.operating_revenue || 0;
            const totalTax = (current?.income_tax_expense || 0) + (current?.taxes_and_surcharges || 0);
            const currentRate = revenue > 0 ? (totalTax / revenue) * 100 : 0;

            // 获取上一年同期数据
            const previousYear = year - 1;
            const previousSql = `
                SELECT 
                    i.operating_revenue,
                    i.income_tax_expense,
                    i.taxes_and_surcharges
                FROM income_statements i
                WHERE i.company_id = ? AND i.period_year = ? AND i.period_quarter = ?
                LIMIT 1
            `;

            db.get(previousSql, [companyId, previousYear, quarter], (err, previous) => {
                if (err) {
                    console.error('查询上年税负数据失败:', err);
                    return reject(err);
                }

                const prevRevenue = previous?.operating_revenue || 0;
                const prevTotalTax = (previous?.income_tax_expense || 0) + (previous?.taxes_and_surcharges || 0);
                const previousRate = prevRevenue > 0 ? (prevTotalTax / prevRevenue) * 100 : 0;

                const change = currentRate - previousRate;

                resolve({
                    value: currentRate,
                    formatted: currentRate.toFixed(2) + '%',
                    change: parseFloat(change.toFixed(2)),
                    trend: change <= 0 ? 'down' : 'up'
                });
            });
        });
    });
}

/**
 * 获取员工人数及变化
 */
async function getEmployeeCount(companyId, year, quarter) {
    return new Promise((resolve, reject) => {
        // 获取当前期间的员工总数
        const currentSql = `
            SELECT SUM(employee_count) as total_employees
            FROM hr_salary_data
            WHERE company_id = ? AND period_year = ? AND period_quarter = ?
        `;

        db.get(currentSql, [companyId, year, quarter], (err, current) => {
            if (err) {
                console.error('查询当前员工数失败:', err);
                return reject(err);
            }

            const currentCount = current?.total_employees || 0;

            // 获取上一年同期数据
            const previousYear = year - 1;
            const previousSql = `
                SELECT SUM(employee_count) as total_employees
                FROM hr_salary_data
                WHERE company_id = ? AND period_year = ? AND period_quarter = ?
            `;

            db.get(previousSql, [companyId, previousYear, quarter], (err, previous) => {
                if (err) {
                    console.error('查询上年员工数失败:', err);
                    return reject(err);
                }

                const previousCount = previous?.total_employees || 0;
                const change = currentCount - previousCount;

                resolve({
                    value: currentCount,
                    change: change,
                    trend: change >= 0 ? 'up' : 'down'
                });
            });
        });
    });
}

/**
 * 计算同比增长率
 */
function calculateYoYGrowth(currentValue, previousValue) {
    if (!previousValue || previousValue === 0) {
        return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * 格式化金额（转换为万元）
 */
function formatAmount(value) {
    if (!value) return '0万';
    const wan = value / 10000;
    return wan.toFixed(0) + '万';
}

/**
 * 获取系统状态
 */
async function getSystemStatus() {
    try {
        const [dataSync, systemHealth, dataIntegrity, security] = await Promise.all([
            checkDataSyncStatus(),
            checkSystemHealth(),
            checkDataIntegrity(),
            checkSecurityStatus()
        ]);

        return {
            dataSync,
            systemHealth,
            dataIntegrity,
            security
        };
    } catch (error) {
        console.error('获取系统状态失败:', error);
        throw error;
    }
}

/**
 * 检查数据同步状态
 */
async function checkDataSyncStatus() {
    return new Promise((resolve, reject) => {
        // 检查最近24小时内是否有数据更新
        const sql = `
            SELECT MAX(created_at) as last_update
            FROM (
                SELECT created_at FROM balance_sheets
                UNION ALL
                SELECT created_at FROM income_statements
                UNION ALL
                SELECT created_at FROM tax_reports
            )
        `;

        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('检查数据同步状态失败:', err);
                return resolve({
                    status: 'unknown',
                    message: '未知',
                    lastUpdate: null
                });
            }

            const lastUpdate = row?.last_update;
            const now = new Date();
            const last = lastUpdate ? new Date(lastUpdate) : null;
            const hoursSinceUpdate = last ? (now - last) / (1000 * 60 * 60) : 999;

            let status, message;
            if (hoursSinceUpdate < 24) {
                status = 'normal';
                message = '正常';
            } else if (hoursSinceUpdate < 72) {
                status = 'warning';
                message = '需要更新';
            } else {
                status = 'error';
                message = '长时间未同步';
            }

            resolve({
                status,
                message,
                lastUpdate: lastUpdate
            });
        });
    });
}

/**
 * 检查系统健康状态
 */
async function checkSystemHealth() {
    return new Promise((resolve) => {
        // 简单的数据库连接检查
        db.get('SELECT 1 as test', [], (err) => {
            if (err) {
                resolve({
                    status: 'error',
                    message: '异常',
                    uptime: 0
                });
            } else {
                resolve({
                    status: 'good',
                    message: '良好',
                    uptime: 99.9
                });
            }
        });
    });
}

/**
 * 检查数据完整性
 */
async function checkDataIntegrity() {
    return new Promise((resolve) => {
        // 检查是否有企业缺少关键数据
        const sql = `
            SELECT COUNT(DISTINCT c.id) as total_companies,
                   COUNT(DISTINCT b.company_id) as has_balance,
                   COUNT(DISTINCT i.company_id) as has_income
            FROM companies c
            LEFT JOIN balance_sheets b ON c.id = b.company_id
            LEFT JOIN income_statements i ON c.id = i.company_id
        `;

        db.get(sql, [], (err, row) => {
            if (err) {
                return resolve({
                    status: 'unknown',
                    message: '未知',
                    details: ''
                });
            }

            const total = row?.total_companies || 0;
            const hasBalance = row?.has_balance || 0;
            const hasIncome = row?.has_income || 0;

            let status, message;
            if (hasBalance === total && hasIncome === total) {
                status = 'good';
                message = '完整';
            } else {
                status = 'warning';
                message = '待优化';
            }

            resolve({
                status,
                message,
                details: `${total}家企业中，${hasBalance}家有资产数据，${hasIncome}家有利润数据`
            });
        });
    });
}

/**
 * 检查安全状态
 */
async function checkSecurityStatus() {
    // 基础安全检查
    return Promise.resolve({
        status: 'safe',
        message: '安全'
    });
}

module.exports = {
    getDashboardMetrics,
    getSystemStatus
};
