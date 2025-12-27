const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 获取所有企业
router.get('/', (req, res) => {
    console.log('开始获取企业列表...');
    db.all('SELECT * FROM companies ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('获取企业列表失败:', err);
            res.status(500).json({ success: false, message: '获取企业列表失败' });
            return;
        }
        console.log('企业列表获取成功，共', rows.length, '条记录');
        res.json({ success: true, data: rows });
    });
});

// 获取单个企业信息
router.get('/:id', (req, res) => {
    const { id } = req.params;
    console.log('获取企业信息，ID:', id);
    db.get('SELECT * FROM companies WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('获取企业信息失败:', err);
            res.status(500).json({ success: false, message: '获取企业信息失败' });
            return;
        }
        if (!row) {
            console.log('企业不存在，ID:', id);
            res.status(404).json({ success: false, message: '企业不存在' });
            return;
        }
        console.log('企业信息获取成功:', row.name);
        res.json({ success: true, data: row });
    });
});

// 创建企业
// 修复创建企业的税号唯一约束问题
router.post('/', (req, res) => {
    const {
        name,
        tax_code,
        company_type,
        legal_person,
        registered_capital,
        establishment_date,
        business_term,
        address,
        business_scope,
        industry,
        industry_code,
        company_scale,
        employee_count,
        shareholder_info
    } = req.body;

    console.log('创建企业:', name);

    // 处理空税号的情况 - 如果税号为空字符串，设置为NULL
    const processedTaxCode = (tax_code && tax_code.trim()) ? tax_code.trim() : null;

    const sql = `
        INSERT INTO companies (
            name, tax_code, company_type, legal_person, registered_capital,
            establishment_date, business_term, address, business_scope,
            industry, industry_code, company_scale, employee_count, shareholder_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        name, processedTaxCode, company_type, legal_person, registered_capital,
        establishment_date, business_term, address, business_scope,
        industry, industry_code, company_scale, employee_count, shareholder_info
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('创建企业失败:', err);

            // 提供更友好的错误信息
            let errorMessage = '创建企业失败';
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                if (err.message.includes('tax_code')) {
                    errorMessage = '税号已存在，请检查统一社会信用代码是否重复';
                } else {
                    errorMessage = '企业信息重复，请检查企业名称或税号';
                }
            }

            res.status(500).json({ success: false, message: errorMessage });
            return;
        }
        console.log('企业创建成功，ID:', this.lastID);
        res.status(201).json({
            success: true,
            message: '企业创建成功',
            data: { id: this.lastID }
        });
    });
});

// 新增：获取企业可用的报告期
router.get('/:id/periods', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('获取企业可用报告期，企业ID:', id);

        // 检查企业是否存在
        const company = await getCompanyById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: '企业不存在' });
        }

        // 获取所有数据表的期间信息
        const [
            balanceSheetPeriods,
            incomeStatementPeriods,
            taxReportPeriods,
            invoicePeriods,
            hrSalaryPeriods,
            accountBalancePeriods
        ] = await Promise.all([
            getPeriodsFromTable('balance_sheets', id),
            getPeriodsFromTable('income_statements', id),
            getPeriodsFromTable('tax_reports', id),
            getPeriodsFromTable('invoices', id),
            getPeriodsFromTable('hr_salary_data', id),
            getPeriodsFromTable('account_balances', id)
        ]);

        // 合并所有期间并去重
        const allPeriods = new Map();

        const addPeriods = (periods, dataType) => {
            periods.forEach(period => {
                const key = `${period.period_year}-${period.period_month || 0}-${period.period_quarter || 0}`;
                if (!allPeriods.has(key)) {
                    allPeriods.set(key, {
                        period_key: key,
                        period_year: period.period_year,
                        period_month: period.period_month,
                        period_quarter: period.period_quarter,
                        data_types: [dataType]
                    });
                } else {
                    allPeriods.get(key).data_types.push(dataType);
                }
            });
        };

        addPeriods(balanceSheetPeriods, '资产负债表');
        addPeriods(incomeStatementPeriods, '利润表');
        addPeriods(taxReportPeriods, '税务申报');
        addPeriods(invoicePeriods, '发票数据');
        addPeriods(hrSalaryPeriods, '人事薪酬');
        addPeriods(accountBalancePeriods, '科目余额');

        // 转换为数组并排序（最新的在前）
        const sortedPeriods = Array.from(allPeriods.values()).sort((a, b) => {
            const aSort = a.period_year * 10000 + (a.period_month || 0) * 100 + (a.period_quarter || 0);
            const bSort = b.period_year * 10000 + (b.period_month || 0) * 100 + (b.period_quarter || 0);
            return bSort - aSort;
        });

        console.log(`找到 ${sortedPeriods.length} 个可用报告期`);
        res.json({
            success: true,
            data: sortedPeriods
        });

    } catch (error) {
        console.error('获取企业可用报告期失败:', error);
        res.status(500).json({
            success: false,
            message: '获取企业可用报告期失败: ' + error.message
        });
    }
});

// 新增：获取企业数据完整性状态
// 修复：获取企业数据完整性状态 - 修复检测逻辑
router.get('/:id/data-status', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('获取企业数据状态，企业ID:', id);

        // 检查企业是否存在
        const company = await getCompanyById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: '企业不存在' });
        }

        // 直接查询每种数据的存在性 - 更简单直接的方法
        const [
            balanceSheetCount,
            incomeStatementCount,
            taxReportCount,
            invoiceCount,
            hrSalaryCount,
            accountBalanceCount
        ] = await Promise.all([
            getTableDataCount('balance_sheets', id),
            getTableDataCount('income_statements', id),
            getTableDataCount('tax_reports', id),
            getTableDataCount('invoices', id),
            getTableDataCount('hr_salary_data', id),
            getTableDataCount('account_balances', id)
        ]);

        // 获取详细的期间信息
        const [
            balanceSheetDetails,
            incomeStatementDetails,
            taxReportDetails,
            invoiceDetails,
            hrSalaryDetails,
            accountBalanceDetails
        ] = await Promise.all([
            getDataWithDetails('balance_sheets', id),
            getDataWithDetails('income_statements', id),
            getDataWithDetails('tax_reports', id),
            getDataWithDetails('invoices', id),
            getDataWithDetails('hr_salary_data', id),
            getDataWithDetails('account_balances', id)
        ]);

        const dataStatus = {
            hasCompanyInfo: !!(company.name && company.tax_code),
            companyInfoDetails: company.name && company.tax_code ? [{
                period: '企业基本信息',
                count: 1
            }] : [],

            hasBalanceSheet: balanceSheetCount > 0,
            balanceSheetDetails: groupDataByPeriod(balanceSheetDetails),

            hasIncomeStatement: incomeStatementCount > 0,
            incomeStatementDetails: groupDataByPeriod(incomeStatementDetails),

            hasTaxReports: taxReportCount > 0,
            taxReportsDetails: groupDataByPeriod(taxReportDetails),

            hasInvoices: invoiceCount > 0,
            invoicesDetails: groupDataByPeriod(invoiceDetails),

            hasHRData: hrSalaryCount > 0,
            hrDataDetails: groupDataByPeriod(hrSalaryDetails),

            hasAccountBalances: accountBalanceCount > 0,
            accountBalancesDetails: groupDataByPeriod(accountBalanceDetails)
        };

        console.log('企业数据状态检测结果:', dataStatus);
        res.json({
            success: true,
            data: dataStatus
        });

    } catch (error) {
        console.error('获取企业数据状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取企业数据状态失败: ' + error.message
        });
    }
});

// 获取企业完整画像数据 - 修改为支持按报告期查询
// 修改：获取企业完整画像数据 - 修改为支持按报告期查询
router.get('/:id/profile', async (req, res) => {
    try {
        const { id } = req.params;
        const { period_year, period_month, period_quarter } = req.query;

        console.log('开始获取企业画像，企业ID:', id);
        console.log('查询参数:', { period_year, period_month, period_quarter });

        // 获取企业基础信息
        const company = await getCompanyById(id);
        if (!company) {
            console.log('企业不存在，ID:', id);
            return res.status(404).json({ success: false, message: '企业不存在' });
        }

        console.log('企业基础信息获取成功:', company.name);

        // 根据期间参数获取对应的财务数据
        let whereClause = 'WHERE company_id = ?';
        let params = [id];

        if (period_year) {
            whereClause += ' AND period_year = ?';
            params.push(parseInt(period_year));
        }

        if (period_month) {
            whereClause += ' AND period_month = ?';
            params.push(parseInt(period_month));
        } else if (period_quarter) {
            whereClause += ' AND period_quarter = ?';
            params.push(parseInt(period_quarter));
        }

        console.log('查询条件:', whereClause, params);

        // 获取指定期间的财务数据
        const [
            balanceSheets,
            incomeStatements,
            taxReports,
            invoices,
            hrSalaryData,
            accountBalances
        ] = await Promise.all([
            getBalanceSheetsWithFilter(whereClause, params),
            getIncomeStatementsWithFilter(whereClause, params),
            getTaxReportsWithFilter(whereClause, params),
            getInvoicesWithFilter(whereClause, params),
            getHRSalaryDataWithFilter(whereClause, params),
            getAccountBalancesWithFilter(whereClause, params)
        ]);

        console.log('指定期间数据获取完成:', {
            balanceSheets: balanceSheets.length,
            incomeStatements: incomeStatements.length,
            taxReports: taxReports.length,
            invoices: invoices.length,
            hrSalaryData: hrSalaryData.length,
            accountBalances: accountBalances.length
        });

        // 修改：获取上一年度对比数据 - 直接从数据库查询
        let previousBalanceSheets = [];
        let previousIncomeStatements = [];

        if (period_year) {
            const currentYear = parseInt(period_year);
            const previousYear = currentYear - 1;

            console.log(`获取上一年度(${previousYear})对比数据...`);

            // 直接查询上一年度的最佳数据（优先第四季度）
            [previousBalanceSheets, previousIncomeStatements] = await Promise.all([
                getBestYearlyBalanceSheets(id, previousYear),
                getBestYearlyIncomeStatements(id, previousYear)
            ]);

            console.log('上一年度数据获取完成:', {
                previousBalanceSheets: previousBalanceSheets.length,
                previousIncomeStatements: previousIncomeStatements.length
            });
        }

        // 构建画像数据（仅使用真实数据）
        const profileData = buildProfileFromRealDataWithPeriod(
            company,
            balanceSheets,
            incomeStatements,
            taxReports,
            invoices,
            hrSalaryData,
            accountBalances,
            previousBalanceSheets,
            previousIncomeStatements
        );

        console.log('企业画像生成成功');
        res.json({
            success: true,
            data: profileData
        });

    } catch (error) {
        console.error('获取企业画像失败:', error);
        res.status(500).json({
            success: false,
            message: '获取企业画像失败: ' + error.message
        });
    }
});
// 新增：获取指定年份的最佳资产负债表数据
async function getBestYearlyBalanceSheets(companyId, year) {
    return new Promise((resolve, reject) => {
        console.log(`查询${year}年资产负债表数据，企业ID: ${companyId}`);

        // 优先查找第四季度，然后按季度降序查找
        const sql = `
            SELECT * FROM balance_sheets 
            WHERE company_id = ? AND period_year = ? 
            ORDER BY period_quarter DESC, period_month DESC 
            LIMIT 1
        `;

        db.all(sql, [companyId, year], (err, rows) => {
            if (err) {
                console.log(`${year}年资产负债表查询失败:`, err.message);
                resolve([]);
            } else {
                console.log(`${year}年资产负债表查询结果:`, rows.length > 0 ?
                    `${rows[0].period_year}年Q${rows[0].period_quarter}` : '无数据');
                resolve(rows || []);
            }
        });
    });
}

// 新增：获取指定年份的最佳利润表数据
async function getBestYearlyIncomeStatements(companyId, year) {
    return new Promise((resolve, reject) => {
        console.log(`查询${year}年利润表数据，企业ID: ${companyId}`);

        // 优先查找第四季度，然后按季度降序查找
        const sql = `
            SELECT * FROM income_statements 
            WHERE company_id = ? AND period_year = ? 
            ORDER BY period_quarter DESC, period_month DESC 
            LIMIT 1
        `;

        db.all(sql, [companyId, year], (err, rows) => {
            if (err) {
                console.log(`${year}年利润表查询失败:`, err.message);
                resolve([]);
            } else {
                console.log(`${year}年利润表查询结果:`, rows.length > 0 ?
                    `${rows[0].period_year}年Q${rows[0].period_quarter}` : '无数据');
                resolve(rows || []);
            }
        });
    });
}


// 批量删除企业接口
router.delete('/batch', (req, res) => {
    const { companyIds } = req.body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: '请提供要删除的企业ID列表'
        });
    }

    console.log('开始批量删除企业，IDs:', companyIds);

    // 首先获取企业信息用于返回消息
    const placeholders = companyIds.map(() => '?').join(',');
    db.all(`SELECT id, name FROM companies WHERE id IN (${placeholders})`, companyIds, (err, companies) => {
        if (err) {
            console.error('查询企业信息失败:', err);
            return res.status(500).json({ success: false, message: '查询企业信息失败' });
        }

        if (companies.length === 0) {
            return res.status(404).json({ success: false, message: '未找到要删除的企业' });
        }

        // 删除相关数据的SQL语句
        const deleteQueries = [
            `DELETE FROM account_balances WHERE company_id IN (${placeholders})`,
            `DELETE FROM hr_salary_data WHERE company_id IN (${placeholders})`,
            `DELETE FROM employees WHERE company_id IN (${placeholders})`,
            `DELETE FROM invoices WHERE company_id IN (${placeholders})`,
            `DELETE FROM tax_reports WHERE company_id IN (${placeholders})`,
            `DELETE FROM income_statements WHERE company_id IN (${placeholders})`,
            `DELETE FROM balance_sheets WHERE company_id IN (${placeholders})`,
            `DELETE FROM companies WHERE id IN (${placeholders})`
        ];

        // 按顺序执行删除操作
        let completed = 0;
        let hasError = false;
        const companyNames = companies.map(c => c.name).join('、');

        deleteQueries.forEach((query, index) => {
            db.run(query, companyIds, function (err) {
                if (err && !hasError) {
                    hasError = true;
                    console.error(`批量删除失败 (${index}):`, err);
                    return res.status(500).json({ success: false, message: '批量删除企业失败' });
                }

                completed++;
                if (completed === deleteQueries.length && !hasError) {
                    console.log('批量删除成功，企业数量:', companies.length);
                    res.json({
                        success: true,
                        message: `成功删除 ${companies.length} 家企业：${companyNames}`
                    });
                }
            });
        });
    });
});

// 删除单个企业接口
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    console.log('开始删除企业，ID:', id);

    // 首先检查企业是否存在
    db.get('SELECT * FROM companies WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('查询企业失败:', err);
            res.status(500).json({ success: false, message: '查询企业失败' });
            return;
        }

        if (!row) {
            console.log('企业不存在，ID:', id);
            res.status(404).json({ success: false, message: '企业不存在' });
            return;
        }

        // 删除企业及相关数据
        const deleteQueries = [
            'DELETE FROM account_balances WHERE company_id = ?',
            'DELETE FROM hr_salary_data WHERE company_id = ?',
            'DELETE FROM employees WHERE company_id = ?',
            'DELETE FROM invoices WHERE company_id = ?',
            'DELETE FROM tax_reports WHERE company_id = ?',
            'DELETE FROM income_statements WHERE company_id = ?',
            'DELETE FROM balance_sheets WHERE company_id = ?',
            'DELETE FROM companies WHERE id = ?'
        ];

        // 执行删除操作
        let completed = 0;
        let hasError = false;

        deleteQueries.forEach((query, index) => {
            db.run(query, [id], function (err) {
                if (err && !hasError) {
                    hasError = true;
                    console.error(`删除失败 (${index}):`, err);
                    res.status(500).json({ success: false, message: '删除企业失败' });
                    return;
                }

                completed++;
                if (completed === deleteQueries.length && !hasError) {
                    console.log('企业删除成功，ID:', id, '企业名称:', row.name);
                    res.json({
                        success: true,
                        message: `企业"${row.name}"及相关数据删除成功`
                    });
                }
            });
        });
    });
});

// 辅助函数：获取企业基础信息
async function getCompanyById(id) {
    return new Promise((resolve, reject) => {
        console.log('查询企业基础信息, ID:', id);
        db.get(
            'SELECT * FROM companies WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    console.error('企业基础信息查询失败:', err);
                    reject(err);
                } else {
                    console.log('企业基础信息查询结果:', row ? '找到' : '未找到');
                    resolve(row);
                }
            }
        );
    });
}

// 新增：从指定表获取期间信息
// 修复：从指定表获取期间信息 - 更宽松的查询条件
async function getPeriodsFromTable(tableName, companyId) {
    return new Promise((resolve, reject) => {
        // 添加更宽松的查询条件，确保能检测到数据
        const sql = `
            SELECT DISTINCT 
                COALESCE(period_year, 2024) as period_year, 
                COALESCE(period_month, 12) as period_month, 
                COALESCE(period_quarter, 4) as period_quarter,
                COUNT(*) as record_count
            FROM ${tableName} 
            WHERE company_id = ? 
            GROUP BY period_year, period_month, period_quarter
            ORDER BY period_year DESC, period_month DESC, period_quarter DESC
        `;

        db.all(sql, [companyId], (err, rows) => {
            if (err) {
                console.log(`${tableName} 期间查询失败:`, err.message);
                resolve([]);
            } else {
                console.log(`${tableName} 期间查询结果:`, rows);
                resolve(rows || []);
            }
        });
    });
}

// 修复：获取带详细信息的数据 - 确保计数正确
async function getDataWithDetails(tableName, companyId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COALESCE(period_year, 2024) as period_year, 
                COALESCE(period_month, 12) as period_month, 
                COALESCE(period_quarter, 4) as period_quarter, 
                COUNT(*) as count
            FROM ${tableName} 
            WHERE company_id = ? 
            GROUP BY period_year, period_month, period_quarter
            HAVING COUNT(*) > 0
            ORDER BY period_year DESC, period_month DESC, period_quarter DESC
        `;

        db.all(sql, [companyId], (err, rows) => {
            if (err) {
                console.log(`${tableName} 详细数据查询失败:`, err.message);
                resolve([]);
            } else {
                console.log(`${tableName} 详细数据查询结果:`, rows);
                resolve(rows || []);
            }
        });
    });
}

// 新增：简单的数据计数查询
async function getTableDataCount(tableName, companyId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE company_id = ?`;

        db.get(sql, [companyId], (err, row) => {
            if (err) {
                console.log(`${tableName} 计数查询失败:`, err.message);
                resolve(0);
            } else {
                const count = row ? row.count : 0;
                console.log(`${tableName} 数据计数:`, count);
                resolve(count);
            }
        });
    });
}

// 新增：按期间分组数据
function groupDataByPeriod(data) {
    return data.map(item => {
        let periodDisplay = '';
        if (item.period_month && item.period_month !== 12) {
            periodDisplay = `${item.period_year}年${item.period_month}月`;
        } else if (item.period_quarter) {
            periodDisplay = `${item.period_year}年第${item.period_quarter}季度`;
        } else {
            periodDisplay = `${item.period_year}年`;
        }

        return {
            period: periodDisplay,
            count: item.count
        };
    });
}

// 新增：带过滤条件的资产负债表查询
async function getBalanceSheetsWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM balance_sheets ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询资产负债表:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('资产负债表查询失败:', err.message);
                resolve([]);
            } else {
                console.log('资产负债表查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 新增：带过滤条件的利润表查询
async function getIncomeStatementsWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM income_statements ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询利润表:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('利润表查询失败:', err.message);
                resolve([]);
            } else {
                console.log('利润表查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 新增：带过滤条件的税务申报查询
async function getTaxReportsWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tax_reports ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询税务申报:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('税务申报查询失败:', err.message);
                resolve([]);
            } else {
                console.log('税务申报查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 新增：带过滤条件的发票数据查询
async function getInvoicesWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM invoices ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询发票数据:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('发票查询失败:', err.message);
                resolve([]);
            } else {
                console.log('发票查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 新增：带过滤条件的人事薪酬数据查询
async function getHRSalaryDataWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM hr_salary_data ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询人事薪酬数据:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('人事薪酬数据查询失败:', err.message);
                resolve([]);
            } else {
                console.log('人事薪酬数据查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 新增：带过滤条件的科目余额数据查询
async function getAccountBalancesWithFilter(whereClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM account_balances ${whereClause} ORDER BY period_year DESC, period_month DESC`;
        console.log('查询科目余额:', sql, params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.log('科目余额查询失败:', err.message);
                resolve([]);
            } else {
                console.log('科目余额查询成功，记录数:', rows.length);
                resolve(rows || []);
            }
        });
    });
}

// 原有的辅助函数保持不变
async function getBalanceSheets(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询资产负债表, 企业ID:', companyId);
        db.all(
            'SELECT * FROM balance_sheets WHERE company_id = ? ORDER BY period_end_date DESC LIMIT 5',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('资产负债表查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('资产负债表查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

async function getIncomeStatements(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询利润表, 企业ID:', companyId);
        db.all(
            'SELECT * FROM income_statements WHERE company_id = ? ORDER BY period DESC LIMIT 5',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('利润表查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('利润表查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

async function getTaxReports(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询税务申报, 企业ID:', companyId);
        db.all(
            'SELECT * FROM tax_reports WHERE company_id = ? ORDER BY created_at DESC LIMIT 12',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('税务申报查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('税务申报查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

async function getInvoices(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询发票数据, 企业ID:', companyId);
        db.all(
            'SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 1000',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('发票查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('发票查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

async function getHRSalaryData(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询人事薪酬数据, 企业ID:', companyId);
        db.all(
            'SELECT * FROM hr_salary_data WHERE company_id = ?',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('人事薪酬数据查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('人事薪酬数据查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

async function getAccountBalances(companyId) {
    return new Promise((resolve, reject) => {
        console.log('查询科目余额, 企业ID:', companyId);
        db.all(
            'SELECT * FROM account_balances WHERE company_id = ?',
            [companyId],
            (err, rows) => {
                if (err) {
                    console.log('科目余额查询失败:', err.message);
                    resolve([]);
                } else {
                    console.log('科目余额查询成功，记录数:', rows.length);
                    resolve(rows || []);
                }
            }
        );
    });
}

// 修改：构建基于指定期间真实数据的企业画像
// 修改：构建基于指定期间真实数据的企业画像
function buildProfileFromRealDataWithPeriod(company, balanceSheets, incomeStatements, taxReports, invoices, hrSalaryData, accountBalances, previousBalanceSheets = [], previousIncomeStatements = []) {
    const profileData = {
        // 基础信息（必定存在，使用最新数据）
        basicInfo: buildBasicInfo(company),

        // 行业特征（基于企业基础信息）
        industryProfile: buildIndustryProfile(company),

        // 数据状态提示（针对当前查询期间）
        dataStatus: {
            hasBalanceSheet: balanceSheets.length > 0,
            hasIncomeStatement: incomeStatements.length > 0,
            hasTaxReports: taxReports.length > 0,
            hasInvoices: invoices.length > 0,
            hasHRData: hrSalaryData.length > 0,
            hasAccountBalances: accountBalances.length > 0
        }
    };

    // 只有数据存在时才计算相应指标
    if (balanceSheets.length > 0 && incomeStatements.length > 0) {
        profileData.financialIndicators = calculateRealFinancialIndicatorsWithComparison(
            balanceSheets,
            incomeStatements,
            previousBalanceSheets,
            previousIncomeStatements
        );
    }

    if (hrSalaryData.length > 0) {
        profileData.hrAndSalary = calculateRealHRIndicators(hrSalaryData, company.employee_count);
    }

    if (accountBalances.length > 0) {
        profileData.supplyChainData = calculateRealSupplyChainData(accountBalances);
    }

    if (taxReports.length > 0) {
        profileData.taxReporting = calculateRealTaxIndicators(taxReports);

        if (incomeStatements.length > 0) {
            profileData.taxBurdenAnalysis = calculateRealTaxBurdenAnalysis(taxReports, incomeStatements, company.industry_code);
        }
    }

    if (invoices.length > 0) {
        profileData.invoiceTransactions = calculateRealInvoiceIndicators(invoices);
    }

    if (taxReports.length > 0 && invoices.length > 0) {
        profileData.taxCompliance = calculateRealTaxCompliance(taxReports, invoices);
    }

    // 组织架构（基于基础信息和人事数据）
    profileData.organizationalStructure = buildOrganizationalStructure(company, hrSalaryData);

    return profileData;
}

// 新增：计算带对比数据的财务指标 - 完善版
// 修改：计算带对比数据的财务指标 - 完善版（修正发展能力指标计算逻辑）
// 修改：计算带对比数据的财务指标 - 简化版（直接使用传入的对比数据）
function calculateRealFinancialIndicatorsWithComparison(balanceSheets, incomeStatements, previousBalanceSheets, previousIncomeStatements) {
    const latestBalance = balanceSheets[0];
    const latestIncome = incomeStatements[0];
    const previousBalance = previousBalanceSheets.length > 0 ? previousBalanceSheets[0] : null;
    const previousIncome = previousIncomeStatements.length > 0 ? previousIncomeStatements[0] : null;

    const indicators = {
        profitability: {},
        solvency: {},
        efficiency: {},
        growth: {}
    };

    console.log('财务指标计算 - 数据概况:', {
        latestBalance: latestBalance ? `${latestBalance.period_year}-${latestBalance.period_month}` : 'null',
        latestIncome: latestIncome ? `${latestIncome.period_year}-${latestIncome.period_month}` : 'null',
        previousBalance: previousBalance ? `${previousBalance.period_year}-${previousBalance.period_month}` : 'null',
        previousIncome: previousIncome ? `${previousIncome.period_year}-${previousIncome.period_month}` : 'null'
    });

    // 盈利能力指标（保持原有逻辑）
    if (latestIncome) {
        indicators.profitability['营业收入'] = {
            value: formatCurrency(latestIncome.operating_revenue),
            growth: previousIncome && previousIncome.operating_revenue > 0 ?
                `${((latestIncome.operating_revenue - previousIncome.operating_revenue) / previousIncome.operating_revenue * 100).toFixed(1)}%` :
                '无对比数据',
            level: latestIncome.operating_revenue > 0 ? '有收入' : '无收入'
        };

        indicators.profitability['净利润'] = {
            value: formatCurrency(latestIncome.net_profit),
            growth: previousIncome && Math.abs(previousIncome.net_profit) > 0 ?
                `${((latestIncome.net_profit - previousIncome.net_profit) / Math.abs(previousIncome.net_profit) * 100).toFixed(1)}%` :
                '无对比数据',
            level: latestIncome.net_profit > 0 ? '盈利' : '亏损'
        };

        if (latestIncome.operating_revenue > 0) {
            // 毛利率
            const grossMargin = ((latestIncome.operating_revenue - (latestIncome.operating_costs || 0)) / latestIncome.operating_revenue * 100).toFixed(1);
            indicators.profitability['毛利率'] = {
                value: `${grossMargin}%`,
                level: grossMargin > 30 ? '优秀' : grossMargin > 20 ? '良好' : grossMargin > 10 ? '一般' : '偏低'
            };

            // 净利率
            const netMargin = (latestIncome.net_profit / latestIncome.operating_revenue * 100).toFixed(1);
            indicators.profitability['净利率'] = {
                value: `${netMargin}%`,
                level: netMargin > 10 ? '优秀' : netMargin > 5 ? '良好' : netMargin > 0 ? '一般' : '亏损'
            };

            // 营业利润率
            const operatingMargin = ((latestIncome.operating_profit || 0) / latestIncome.operating_revenue * 100).toFixed(1);
            indicators.profitability['营业利润率'] = {
                value: `${operatingMargin}%`,
                level: operatingMargin > 15 ? '优秀' : operatingMargin > 8 ? '良好' : operatingMargin > 0 ? '一般' : '亏损'
            };
        }

        // ROA和ROE（使用当期数据）
        if (latestBalance && latestBalance.total_assets > 0) {
            const roa = (latestIncome.net_profit / latestBalance.total_assets * 100).toFixed(1);
            indicators.profitability['总资产收益率'] = {
                value: `${roa}%`,
                level: roa > 8 ? '优秀' : roa > 4 ? '良好' : roa > 0 ? '一般' : '负收益'
            };
        }

        if (latestBalance && latestBalance.total_equity > 0) {
            const roe = (latestIncome.net_profit / latestBalance.total_equity * 100).toFixed(1);
            indicators.profitability['净资产收益率'] = {
                value: `${roe}%`,
                level: roe > 15 ? '优秀' : roe > 10 ? '良好' : roe > 5 ? '一般' : '偏低'
            };
        }
    }

    // 偿债能力指标（完善版）
    if (latestBalance) {
        // 1. 资产负债率
        if (latestBalance.total_assets > 0) {
            const debtRatio = (latestBalance.total_liabilities / latestBalance.total_assets * 100).toFixed(1);
            indicators.solvency['资产负债率'] = {
                value: `${debtRatio}%`,
                level: debtRatio < 40 ? '优秀' : debtRatio < 60 ? '良好' : debtRatio < 80 ? '适中' : '偏高'
            };

            const equityRatio = (latestBalance.total_equity / latestBalance.total_assets * 100).toFixed(1);
            indicators.solvency['权益比率'] = {
                value: `${equityRatio}%`,
                level: equityRatio > 60 ? '优秀' : equityRatio > 40 ? '良好' : equityRatio > 20 ? '适中' : '偏低'
            };
        }

        // 2. 流动比率
        if (latestBalance.current_liabilities_total > 0) {
            const currentRatio = (latestBalance.current_assets_total / latestBalance.current_liabilities_total).toFixed(2);
            indicators.solvency['流动比率'] = {
                value: currentRatio,
                level: currentRatio > 2 ? '优秀' : currentRatio > 1.5 ? '良好' : currentRatio > 1 ? '适中' : '偏低'
            };

            // 3. 速动比率
            const quickAssets = latestBalance.current_assets_total - (latestBalance.inventory || 0);
            const quickRatio = (quickAssets / latestBalance.current_liabilities_total).toFixed(2);
            indicators.solvency['速动比率'] = {
                value: quickRatio,
                level: quickRatio > 1.2 ? '优秀' : quickRatio > 1 ? '良好' : quickRatio > 0.8 ? '适中' : '偏低'
            };

            // 4. 现金比率
            const cashRatio = (latestBalance.cash_and_equivalents / latestBalance.current_liabilities_total).toFixed(2);
            indicators.solvency['现金比率'] = {
                value: cashRatio,
                level: cashRatio > 0.5 ? '优秀' : cashRatio > 0.3 ? '良好' : cashRatio > 0.1 ? '适中' : '偏低'
            };
        }

        // 5. 产权比率
        if (latestBalance.total_equity > 0) {
            const equityDebtRatio = (latestBalance.total_liabilities / latestBalance.total_equity).toFixed(2);
            indicators.solvency['产权比率'] = {
                value: equityDebtRatio,
                level: equityDebtRatio < 0.6 ? '优秀' : equityDebtRatio < 1 ? '良好' : equityDebtRatio < 1.5 ? '适中' : '偏高'
            };
        }
    }

    // 营运能力指标（完善版）
    if (latestBalance && latestIncome && latestIncome.operating_revenue > 0) {
        // 1. 总资产周转率
        if (latestBalance.total_assets > 0) {
            const assetTurnover = (latestIncome.operating_revenue / latestBalance.total_assets).toFixed(2);
            indicators.efficiency['总资产周转率'] = {
                value: `${assetTurnover}次`,
                level: assetTurnover > 1.5 ? '优秀' : assetTurnover > 1 ? '良好' : assetTurnover > 0.5 ? '一般' : '偏低'
            };
        }

        // 2. 应收账款周转率和周转天数
        if (latestBalance.accounts_receivable > 0) {
            const receivablesTurnover = (latestIncome.operating_revenue / latestBalance.accounts_receivable).toFixed(2);
            const receivablesDays = Math.round(365 / receivablesTurnover);

            indicators.efficiency['应收账款周转率'] = {
                value: `${receivablesTurnover}次`,
                level: receivablesTurnover > 12 ? '优秀' : receivablesTurnover > 6 ? '良好' : receivablesTurnover > 3 ? '一般' : '偏低'
            };

            indicators.efficiency['应收账款周转天数'] = {
                value: `${receivablesDays}天`,
                level: receivablesDays < 30 ? '优秀' : receivablesDays < 60 ? '良好' : receivablesDays < 90 ? '一般' : '偏高'
            };
        }

        // 3. 存货周转率和周转天数
        if (latestBalance.inventory > 0 && latestIncome.operating_costs > 0) {
            const inventoryTurnover = (latestIncome.operating_costs / latestBalance.inventory).toFixed(2);
            const inventoryDays = Math.round(365 / inventoryTurnover);

            indicators.efficiency['存货周转率'] = {
                value: `${inventoryTurnover}次`,
                level: inventoryTurnover > 8 ? '优秀' : inventoryTurnover > 5 ? '良好' : inventoryTurnover > 2 ? '一般' : '偏低'
            };

            indicators.efficiency['存货周转天数'] = {
                value: `${inventoryDays}天`,
                level: inventoryDays < 45 ? '优秀' : inventoryDays < 75 ? '良好' : inventoryDays < 120 ? '一般' : '偏高'
            };
        }

        // 4. 流动资产周转率
        if (latestBalance.current_assets_total > 0) {
            const currentAssetTurnover = (latestIncome.operating_revenue / latestBalance.current_assets_total).toFixed(2);
            indicators.efficiency['流动资产周转率'] = {
                value: `${currentAssetTurnover}次`,
                level: currentAssetTurnover > 2.5 ? '优秀' : currentAssetTurnover > 1.8 ? '良好' : currentAssetTurnover > 1 ? '一般' : '偏低'
            };
        }

        // 5. 固定资产周转率
        if (latestBalance.fixed_assets > 0) {
            const fixedAssetTurnover = (latestIncome.operating_revenue / latestBalance.fixed_assets).toFixed(2);
            indicators.efficiency['固定资产周转率'] = {
                value: `${fixedAssetTurnover}次`,
                level: fixedAssetTurnover > 3 ? '优秀' : fixedAssetTurnover > 2 ? '良好' : fixedAssetTurnover > 1 ? '一般' : '偏低'
            };
        }
    }

    // 发展能力指标（修正版 - 使用传入的对比数据）
    if (latestIncome && previousIncome) {
        console.log('开始计算发展能力指标（年度对比）...');
        console.log('当前年度数据:', {
            year: latestIncome.period_year,
            quarter: latestIncome.period_quarter,
            revenue: latestIncome.operating_revenue,
            profit: latestIncome.net_profit,
            operatingProfit: latestIncome.operating_profit
        });
        console.log('上一年度数据:', {
            year: previousIncome.period_year,
            quarter: previousIncome.period_quarter,
            revenue: previousIncome.operating_revenue,
            profit: previousIncome.net_profit,
            operatingProfit: previousIncome.operating_profit
        });

        // 1. 营业收入增长率
        if (previousIncome.operating_revenue && previousIncome.operating_revenue > 0) {
            const revenueGrowth = ((latestIncome.operating_revenue - previousIncome.operating_revenue) / previousIncome.operating_revenue * 100).toFixed(1);
            indicators.growth['营业收入增长率'] = {
                value: `${revenueGrowth}%`,
                level: revenueGrowth > 20 ? '高速增长' : revenueGrowth > 10 ? '快速增长' : revenueGrowth > 5 ? '稳定增长' : revenueGrowth > 0 ? '缓慢增长' : '负增长'
            };
            console.log('营业收入增长率计算完成:', revenueGrowth);
        }

        // 2. 净利润增长率
        if (previousIncome.net_profit !== undefined && Math.abs(previousIncome.net_profit) > 0) {
            const profitGrowth = ((latestIncome.net_profit - previousIncome.net_profit) / Math.abs(previousIncome.net_profit) * 100).toFixed(1);
            indicators.growth['净利润增长率'] = {
                value: `${profitGrowth}%`,
                level: profitGrowth > 30 ? '高速增长' : profitGrowth > 15 ? '快速增长' : profitGrowth > 5 ? '稳定增长' : profitGrowth > 0 ? '缓慢增长' : '负增长'
            };
            console.log('净利润增长率计算完成:', profitGrowth);
        } else if (latestIncome.net_profit > 0 && previousIncome.net_profit <= 0) {
            indicators.growth['净利润增长率'] = {
                value: '扭亏为盈',
                level: '大幅改善'
            };
            console.log('净利润增长率: 扭亏为盈');
        }

        // 3. 营业利润增长率
        if (previousIncome.operating_profit !== undefined && Math.abs(previousIncome.operating_profit) > 0) {
            const operatingProfitGrowth = ((latestIncome.operating_profit - previousIncome.operating_profit) / Math.abs(previousIncome.operating_profit) * 100).toFixed(1);
            indicators.growth['营业利润增长率'] = {
                value: `${operatingProfitGrowth}%`,
                level: operatingProfitGrowth > 25 ? '高速增长' : operatingProfitGrowth > 12 ? '快速增长' : operatingProfitGrowth > 3 ? '稳定增长' : operatingProfitGrowth > 0 ? '缓慢增长' : '负增长'
            };
            console.log('营业利润增长率计算完成:', operatingProfitGrowth);
        }
    }

    if (latestBalance && previousBalance) {
        console.log('开始计算资产类发展能力指标...');
        console.log('当前年度资产:', {
            year: latestBalance.period_year,
            totalAssets: latestBalance.total_assets,
            totalEquity: latestBalance.total_equity,
            fixedAssets: latestBalance.fixed_assets
        });
        console.log('上一年度资产:', {
            year: previousBalance.period_year,
            totalAssets: previousBalance.total_assets,
            totalEquity: previousBalance.total_equity,
            fixedAssets: previousBalance.fixed_assets
        });

        // 4. 总资产增长率
        if (previousBalance.total_assets > 0) {
            const assetGrowth = ((latestBalance.total_assets - previousBalance.total_assets) / previousBalance.total_assets * 100).toFixed(1);
            indicators.growth['总资产增长率'] = {
                value: `${assetGrowth}%`,
                level: assetGrowth > 20 ? '快速扩张' : assetGrowth > 10 ? '稳定扩张' : assetGrowth > 5 ? '缓慢增长' : assetGrowth > 0 ? '微增长' : '资产收缩'
            };
            console.log('总资产增长率计算完成:', assetGrowth);
        }

        // 5. 净资产增长率
        if (previousBalance.total_equity > 0) {
            const equityGrowth = ((latestBalance.total_equity - previousBalance.total_equity) / previousBalance.total_equity * 100).toFixed(1);
            indicators.growth['净资产增长率'] = {
                value: `${equityGrowth}%`,
                level: equityGrowth > 15 ? '快速积累' : equityGrowth > 8 ? '稳定积累' : equityGrowth > 3 ? '缓慢积累' : equityGrowth > 0 ? '微增长' : '净资产减少'
            };
            console.log('净资产增长率计算完成:', equityGrowth);
        }

        // 6. 固定资产增长率（体现投资扩张能力）
        if (previousBalance.fixed_assets > 0) {
            const fixedAssetGrowth = ((latestBalance.fixed_assets - previousBalance.fixed_assets) / previousBalance.fixed_assets * 100).toFixed(1);
            indicators.growth['固定资产增长率'] = {
                value: `${fixedAssetGrowth}%`,
                level: fixedAssetGrowth > 25 ? '大幅扩张' : fixedAssetGrowth > 10 ? '积极扩张' : fixedAssetGrowth > 0 ? '适度扩张' : fixedAssetGrowth > -5 ? '维持现状' : '设备老化'
            };
            console.log('固定资产增长率计算完成:', fixedAssetGrowth);
        }
    }

    // 如果没有足够的年度对比数据，提供当期基础指标
    //if (Object.keys(indicators.growth).length === 0 && latestIncome) {
    //    console.log('缺少年度对比数据，提供当期发展能力基础指标');

        // 基础规模指标
    //    if (latestIncome.operating_revenue > 0) {
    //        indicators.growth['收入规模'] = {
    //            value: formatCurrency(latestIncome.operating_revenue),
    //            level: latestIncome.operating_revenue > 50000000 ? '大规模' : latestIncome.operating_revenue > 10000000 ? '中等规模' : '小规模'
    //        };
    //    }

        //if (latestIncome.net_profit !== undefined) {
        //    indicators.growth['盈利状况'] = {
        //       value: formatCurrency(latestIncome.net_profit),
        //        level: latestIncome.net_profit > 0 ? '盈利状态' : '亏损状态'
        //    };
        //}

        // 如果有资产负债表数据，补充资产规模指标
   //     if (latestBalance && latestBalance.total_assets > 0) {
   //         indicators.growth['资产规模'] = {
   //             value: formatCurrency(latestBalance.total_assets),
   //             level: latestBalance.total_assets > 100000000 ? '大规模' : latestBalance.total_assets > 20000000 ? '中等规模' : '小规模'
   //         };
   //     }
   // }

    console.log('财务指标计算完成:', {
        profitability: Object.keys(indicators.profitability).length,
        solvency: Object.keys(indicators.solvency).length,
        efficiency: Object.keys(indicators.efficiency).length,
        growth: Object.keys(indicators.growth).length
    });

    return indicators;
}

// 新增：查找指定年份的最佳年度数据（优先第四季度，然后是最后季度）
function findBestYearlyData(dataArray, targetYear) {
    if (!dataArray || dataArray.length === 0 || !targetYear) {
        return null;
    }

    // 筛选出目标年份的所有数据
    const yearData = dataArray.filter(item => item.period_year === targetYear);

    if (yearData.length === 0) {
        return null;
    }

    console.log(`查找${targetYear}年的最佳年度数据，候选数据:`, yearData.map(item =>
        `${item.period_year}年Q${item.period_quarter}`
    ));

    // 优先查找第四季度数据
    const q4Data = yearData.find(item => item.period_quarter === 4);
    if (q4Data) {
        console.log(`使用${targetYear}年第四季度数据作为年度数据`);
        return q4Data;
    }

    // 如果没有第四季度，找最大的季度数据
    const maxQuarter = Math.max(...yearData.map(item => item.period_quarter || 1));
    const bestData = yearData.find(item => (item.period_quarter || 1) === maxQuarter);

    if (bestData) {
        console.log(`使用${targetYear}年第${maxQuarter}季度数据作为年度数据`);
        return bestData;
    }

    // 如果都没有quarter信息，使用第一个
    console.log(`使用${targetYear}年的第一个可用数据作为年度数据`);
    return yearData[0];
}

// 原有的其他辅助函数保持不变
function buildBasicInfo(company) {
    return {
        name: company.name,
        taxCode: company.tax_code,
        companyType: company.company_type,
        legalPerson: company.legal_person,
        registeredCapital: company.registered_capital,
        establishmentDate: company.establishment_date,
        address: company.address,
        businessScope: company.business_scope,
        industry: company.industry,
        industryCode: company.industry_code,
        companyScale: company.company_scale,
        employeeCount: company.employee_count,
        shareholders: parseShareholderInfo(company.shareholder_info)
    };
}

function buildIndustryProfile(company) {
    const industryProfiles = {
        '6510': {
            classification: '6510 - 软件开发',
            characteristics: ['技术密集型', '人才密集型', '轻资产']
        },
        '6520': {
            classification: '6520 - 信息系统集成服务',
            characteristics: ['技术服务型', '项目导向型', '人才密集型']
        },
        '5110': {
            classification: '5110 - 批发业',
            characteristics: ['资金密集型', '渠道依赖型', '库存管理型']
        }
    };

    const profile = industryProfiles[company.industry_code] || {
        classification: `${company.industry_code} - ${company.industry}`,
        characteristics: ['一般行业特征']
    };

    return {
        ...profile,
        marketPosition: {
            ranking: '数据不足',
            marketShare: '数据不足'
        }
    };
}

function calculateRealHRIndicators(hrSalaryData, totalEmployees) {
    const employeeStructure = hrSalaryData.map(dept => ({
        department: dept.department,
        count: dept.employee_count,
        ratio: `${(dept.employee_count / totalEmployees * 100).toFixed(1)}%`,
        avgSalary: `${dept.average_salary}元`
    }));

    const totalSalary = hrSalaryData.reduce((sum, dept) => sum + (dept.average_salary * dept.employee_count), 0);
    const avgSalary = Math.round(totalSalary / totalEmployees);

    return {
        employeeStructure,
        compensationStructure: {
            totalEmployees: totalEmployees,
            averageSalary: `${avgSalary}元`,
            socialInsuranceCoverage: '数据待完善',
            housingFundCoverage: '数据待完善'
        }
    };
}

function calculateRealSupplyChainData(accountBalances) {
    const receivables = accountBalances.find(acc => acc.account_name.includes('应收'))?.ending_balance || 0;
    const payables = accountBalances.find(acc => acc.account_name.includes('应付'))?.ending_balance || 0;
    const inventory = accountBalances.find(acc => acc.account_name.includes('存货'))?.ending_balance || 0;

    return {
        supplierCount: '数据不足',
        customerCount: '数据不足',
        averageTransactionAmount: '数据不足',
        accountsReceivable: formatCurrency(receivables),
        accountsPayable: formatCurrency(payables),
        inventoryLevel: formatCurrency(inventory)
    };
}

function calculateRealTaxIndicators(taxReports) {
    const vatReports = taxReports.filter(report => report.tax_type.includes('增值税'));
    const citReports = taxReports.filter(report => report.tax_type.includes('企业所得税'));

    const indicators = {};

    if (citReports.length > 0) {
        const latestCIT = citReports[0];
        indicators.corporateIncomeTax = {
            taxableIncome: formatCurrency(latestCIT.taxable_amount),
            taxRate: latestCIT.tax_rate,
            taxAmount: formatCurrency(latestCIT.paid_amount)
        };
    }

    if (vatReports.length > 0) {
        const latestVAT = vatReports[0];
        indicators.valueAddedTax = {
            taxableAmount: formatCurrency(latestVAT.taxable_amount),
            taxRate: latestVAT.tax_rate,
            taxAmount: formatCurrency(latestVAT.paid_amount)
        };
    }

    return indicators;
}

function calculateRealInvoiceIndicators(invoices) {
    const specialVATInvoices = invoices.filter(inv => inv.invoice_type?.includes('专用'));
    const normalVATInvoices = invoices.filter(inv => inv.invoice_type?.includes('普通'));

    const specialVATAmount = specialVATInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const normalVATAmount = normalVATInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return {
        issuance: {
            specialVATAmount: formatCurrency(specialVATAmount),
            normalVATAmount: formatCurrency(normalVATAmount),
            totalCount: invoices.length
        },
        businessTaxStructure: {
            mainTaxRate: '数据不足',
            taxableAmount: formatCurrency(specialVATAmount + normalVATAmount)
        }
    };
}

function calculateRealTaxCompliance(taxReports, invoices) {
    return {
        taxFilingStatus: taxReports.length > 0 ? '有申报记录' : '无申报记录',
        taxBurdenRate: '需要结合收入数据计算',
        complianceRating: '数据不足',
        invoiceManagement: {
            complianceRate: '数据不足',
            electronicInvoiceRate: '数据不足'
        }
    };
}

function calculateRealTaxBurdenAnalysis(taxReports, incomeStatements, industryCode) {
    const latestIncome = incomeStatements[0];
    const revenue = latestIncome?.operating_revenue || 0;

    const actualTaxBurden = {};

    if (revenue > 0) {
        taxReports.forEach(report => {
            const burden = ((report.paid_amount / revenue) * 100).toFixed(2);
            actualTaxBurden[report.tax_type] = `${burden}%`;
        });
    }

    return {
        actualTaxBurden,
        industryComparison: {
            message: '需要行业数据库支持'
        },
        optimizationSpace: revenue > 0 ? ['基于实际数据的税务优化建议'] : ['需要更多数据支持']
    };
}

function buildOrganizationalStructure(company, hrSalaryData) {
    return {
        equityStructure: parseShareholderInfo(company.shareholder_info),
        personnelStructure: hrSalaryData.map(dept => ({
            department: dept.department,
            count: dept.employee_count,
            ratio: `${(dept.employee_count / company.employee_count * 100).toFixed(1)}%`
        }))
    };
}

function parseShareholderInfo(shareholderInfo) {
    if (!shareholderInfo) return [];

    try {
        return shareholderInfo.split(';').map(item => {
            const [name, ratio] = item.split('(');
            return {
                name: name.trim(),
                ratio: ratio ? ratio.replace(')', '') : '0%'
            };
        });
    } catch (error) {
        return [];
    }
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return '0元';
    if (amount >= 10000) {
        return `${(amount / 10000).toFixed(1)}万元`;
    }
    return `${amount.toFixed(0)}元`;
}

// 构建基于真实数据的企业画像（兼容原有接口）
function buildProfileFromRealData(company, balanceSheets, incomeStatements, taxReports, invoices, hrSalaryData, accountBalances) {
    return buildProfileFromRealDataWithPeriod(company, balanceSheets, incomeStatements, taxReports, invoices, hrSalaryData, accountBalances);
}

module.exports = router;