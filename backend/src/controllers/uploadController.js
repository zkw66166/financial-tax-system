const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const excelParser = require('../services/excelParser');
const dbManager = require('../models/database');

class UploadController {
    constructor() {
        this.db = dbManager.getDatabase();
        this.setupStorage();
    }

    setupStorage() {
        // 创建上传文件夹
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 配置multer存储
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        this.upload = multer({
            storage: storage,
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['.xlsx', '.xls'];
                const fileExt = path.extname(file.originalname).toLowerCase();

                if (allowedTypes.includes(fileExt)) {
                    cb(null, true);
                } else {
                    cb(new Error('只支持Excel文件格式(.xlsx, .xls)'));
                }
            },
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB限制
            }
        });
    }

    // 新增：批量上传多个文件 - 支持多年数据导入策略
    uploadBatchFiles = async (req, res) => {
        try {
            const { companyId } = req.params;
            const files = req.files;
            const importStrategy = req.body.strategy || 'append'; // 默认追加策略

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            console.log(`开始批量处理 ${files.length} 个文件，企业ID: ${companyId}，导入策略: ${importStrategy}`);

            const results = [];
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = file.originalname;

                try {
                    console.log(`\n处理文件 ${i + 1}/${files.length}: ${fileName}`);
                    console.log(`文件大小: ${file.size} bytes`);

                    // 读取文件内容
                    const buffer = fs.readFileSync(file.path);
                    console.log(`文件读取成功，buffer长度: ${buffer.length}`);

                    // 识别文件类型
                    const fileType = excelParser.identifyFileType(buffer);
                    console.log(`文件类型识别结果: ${fileType}`);

                    if (!fileType) {
                        // 提供更详细的错误信息
                        const workbook = XLSX.read(buffer);
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                        const sampleCells = {};
                        ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C1', 'D1'].forEach(cell => {
                            const value = worksheet[cell] ? worksheet[cell].v : '';
                            if (value) sampleCells[cell] = value;
                        });

                        throw new Error(`无法识别文件类型。请检查文件格式。文件内容示例: ${JSON.stringify(sampleCells)}`);
                    }

                    console.log(`文件 ${fileName} 识别为: ${excelParser.getFileTypeName(fileType)}`);

                    // 根据文件类型处理数据 - 传递导入策略
                    const result = await this.processFileByType(companyId, fileType, buffer, fileName, importStrategy);

                    results.push({
                        fileName: fileName,
                        fileType: excelParser.getFileTypeName(fileType),
                        success: true,
                        message: result.message,
                        data: result.data
                    });

                    successCount++;
                    console.log(`文件 ${fileName} 处理成功`);

                } catch (error) {
                    console.error(`文件 ${fileName} 处理失败:`, error);

                    results.push({
                        fileName: fileName,
                        fileType: '识别失败',
                        success: false,
                        message: error.message,
                        data: null
                    });

                    failureCount++;
                } finally {
                    // 删除临时文件
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }

            // 返回批量处理结果
            res.json({
                success: true,
                message: `批量上传完成：成功 ${successCount} 个，失败 ${failureCount} 个`,
                data: {
                    totalFiles: files.length,
                    successCount: successCount,
                    failureCount: failureCount,
                    results: results
                }
            });

        } catch (error) {
            console.error('批量上传失败:', error);

            // 清理所有临时文件
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            res.status(500).json({
                success: false,
                message: '批量上传失败: ' + error.message
            });
        }
    }

    // 修改：根据文件类型处理数据 - 增加导入策略参数
    async processFileByType(companyId, fileType, buffer, fileName, importStrategy = 'append') {
        switch (fileType) {
            case 'company-info':
                return await this.processCompanyInfo(companyId, buffer, importStrategy);
            case 'balance-sheet':
                return await this.processBalanceSheet(companyId, buffer, importStrategy);
            case 'income-statement':
                return await this.processIncomeStatement(companyId, buffer, importStrategy);
            case 'tax-reports':
                return await this.processTaxReports(companyId, buffer, importStrategy);
            case 'invoice-data':
                return await this.processInvoiceData(companyId, buffer, importStrategy);
            case 'hr-salary':
                return await this.processHRSalaryData(companyId, buffer, importStrategy);
            case 'account-balance':
                return await this.processAccountBalance(companyId, buffer, importStrategy);
            default:
                throw new Error(`不支持的文件类型: ${fileType}`);
        }
    }

    // 处理企业信息
    async processCompanyInfo(companyId, buffer, importStrategy = 'update') {
        const companyData = excelParser.parseCompanyInfo(buffer);

        // 检查税号冲突
        const currentCompany = this.db.db.prepare('SELECT tax_code FROM companies WHERE id = ?').get(companyId);
        if (companyData.tax_code && companyData.tax_code.trim()) {
            const existingCompany = this.db.db.prepare('SELECT id FROM companies WHERE tax_code = ? AND id != ?').get(companyData.tax_code, companyId);
            if (existingCompany) {
                throw new Error(`税号 ${companyData.tax_code} 已被其他企业使用`);
            }
        }

        const stmt = this.db.db.prepare(`
            UPDATE companies SET
                name = ?, tax_code = ?, company_type = ?, legal_person = ?,
                registered_capital = ?, establishment_date = ?, business_term = ?,
                address = ?, business_scope = ?, industry = ?, industry_code = ?,
                company_scale = ?, employee_count = ?, shareholder_info = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(
            companyData.name,
            companyData.tax_code || null,
            companyData.company_type,
            companyData.legal_person,
            companyData.registered_capital,
            companyData.establishment_date,
            companyData.business_term,
            companyData.address,
            companyData.business_scope,
            companyData.industry,
            companyData.industry_code,
            companyData.company_scale,
            companyData.employee_count,
            companyData.shareholder_info,
            companyId
        );

        return {
            message: '企业信息更新成功',
            data: companyData
        };
    }

    // 修改：处理资产负债表 - 支持多年数据导入策略
    async processBalanceSheet(companyId, buffer, importStrategy = 'append') {
        const balanceSheetData = excelParser.parseBalanceSheet(buffer);

        const existingData = this.db.db.prepare(`
            SELECT id FROM balance_sheets 
            WHERE company_id = ? AND period_year = ? AND period_month = ?
        `).get(companyId, balanceSheetData.period_year, balanceSheetData.period_month);

        let operation = '';

        if (existingData) {
            if (importStrategy === 'skip') {
                console.log(`跳过重复数据: ${balanceSheetData.period_year}年${balanceSheetData.period_month}月资产负债表`);
                return {
                    message: `跳过重复数据 (${balanceSheetData.period_year}年${balanceSheetData.period_month}月)`,
                    data: balanceSheetData
                };
            } else if (importStrategy === 'update' || importStrategy === 'append') {
                // 更新现有数据
                const stmt = this.db.db.prepare(`
                    UPDATE balance_sheets SET
                        period_end_date = ?, cash_and_equivalents = ?, trading_financial_assets = ?,
                        accounts_receivable = ?, prepayments = ?, other_receivables = ?, inventory = ?, 
                        current_assets_total = ?, long_term_equity_investment = ?, fixed_assets = ?, 
                        accumulated_depreciation = ?, intangible_assets = ?, accumulated_amortization = ?, 
                        non_current_assets_total = ?, total_assets = ?, short_term_loans = ?, 
                        accounts_payable = ?, employee_benefits_payable = ?, taxes_payable = ?, 
                        current_liabilities_total = ?, long_term_loans = ?, non_current_liabilities_total = ?, 
                        total_liabilities = ?, paid_in_capital = ?, capital_surplus = ?, surplus_reserves = ?, 
                        retained_earnings = ?, total_equity = ?
                    WHERE id = ?
                `);

                stmt.run(
                    balanceSheetData.period_end_date,
                    balanceSheetData.cash_and_equivalents,
                    balanceSheetData.trading_financial_assets,
                    balanceSheetData.accounts_receivable,
                    balanceSheetData.prepayments,
                    balanceSheetData.other_receivables,
                    balanceSheetData.inventory,
                    balanceSheetData.current_assets_total,
                    balanceSheetData.long_term_equity_investment,
                    balanceSheetData.fixed_assets,
                    balanceSheetData.accumulated_depreciation,
                    balanceSheetData.intangible_assets,
                    balanceSheetData.accumulated_amortization,
                    balanceSheetData.non_current_assets_total,
                    balanceSheetData.total_assets,
                    balanceSheetData.short_term_loans,
                    balanceSheetData.accounts_payable,
                    balanceSheetData.employee_benefits_payable,
                    balanceSheetData.taxes_payable,
                    balanceSheetData.current_liabilities_total,
                    balanceSheetData.long_term_loans,
                    balanceSheetData.non_current_liabilities_total,
                    balanceSheetData.total_liabilities,
                    balanceSheetData.paid_in_capital,
                    balanceSheetData.capital_surplus,
                    balanceSheetData.surplus_reserves,
                    balanceSheetData.retained_earnings,
                    balanceSheetData.total_equity,
                    existingData.id
                );
                operation = '更新';
            }
        } else {
            // 插入新数据
            const stmt = this.db.db.prepare(`
                INSERT INTO balance_sheets (
                    company_id, period_year, period_month, period_quarter, period_end_date, 
                    cash_and_equivalents, trading_financial_assets, accounts_receivable, prepayments, 
                    other_receivables, inventory, current_assets_total, long_term_equity_investment, 
                    fixed_assets, accumulated_depreciation, intangible_assets, accumulated_amortization, 
                    non_current_assets_total, total_assets, short_term_loans, accounts_payable, 
                    employee_benefits_payable, taxes_payable, current_liabilities_total, long_term_loans, 
                    non_current_liabilities_total, total_liabilities, paid_in_capital, capital_surplus, 
                    surplus_reserves, retained_earnings, total_equity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                companyId,
                balanceSheetData.period_year,
                balanceSheetData.period_month,
                balanceSheetData.period_quarter,
                balanceSheetData.period_end_date,
                balanceSheetData.cash_and_equivalents,
                balanceSheetData.trading_financial_assets,
                balanceSheetData.accounts_receivable,
                balanceSheetData.prepayments,
                balanceSheetData.other_receivables,
                balanceSheetData.inventory,
                balanceSheetData.current_assets_total,
                balanceSheetData.long_term_equity_investment,
                balanceSheetData.fixed_assets,
                balanceSheetData.accumulated_depreciation,
                balanceSheetData.intangible_assets,
                balanceSheetData.accumulated_amortization,
                balanceSheetData.non_current_assets_total,
                balanceSheetData.total_assets,
                balanceSheetData.short_term_loans,
                balanceSheetData.accounts_payable,
                balanceSheetData.employee_benefits_payable,
                balanceSheetData.taxes_payable,
                balanceSheetData.current_liabilities_total,
                balanceSheetData.long_term_loans,
                balanceSheetData.non_current_liabilities_total,
                balanceSheetData.total_liabilities,
                balanceSheetData.paid_in_capital,
                balanceSheetData.capital_surplus,
                balanceSheetData.surplus_reserves,
                balanceSheetData.retained_earnings,
                balanceSheetData.total_equity
            );
            operation = '导入';
        }

        return {
            message: `资产负债表${operation}成功 (${balanceSheetData.period_year}年${balanceSheetData.period_month}月)`,
            data: balanceSheetData
        };
    }

    // 修改：处理利润表 - 支持多年数据导入策略
    async processIncomeStatement(companyId, buffer, importStrategy = 'append') {
        const incomeData = excelParser.parseIncomeStatement(buffer);

        const existingData = this.db.db.prepare(`
            SELECT id FROM income_statements 
            WHERE company_id = ? AND period_year = ? AND period_month = ?
        `).get(companyId, incomeData.period_year, incomeData.period_month);

        let operation = '';

        if (existingData) {
            if (importStrategy === 'skip') {
                console.log(`跳过重复数据: ${incomeData.period_year}年${incomeData.period_month}月利润表`);
                return {
                    message: `跳过重复数据 (${incomeData.period_year}年${incomeData.period_month}月)`,
                    data: incomeData
                };
            } else if (importStrategy === 'update' || importStrategy === 'append') {
                const stmt = this.db.db.prepare(`
                    UPDATE income_statements SET
                        period = ?, operating_revenue = ?, operating_costs = ?, taxes_and_surcharges = ?,
                        selling_expenses = ?, administrative_expenses = ?, financial_expenses = ?, 
                        operating_profit = ?, non_operating_income = ?, non_operating_expenses = ?, 
                        total_profit = ?, income_tax_expense = ?, net_profit = ?
                    WHERE id = ?
                `);

                stmt.run(
                    incomeData.period,
                    incomeData.operating_revenue,
                    incomeData.operating_costs,
                    incomeData.taxes_and_surcharges,
                    incomeData.selling_expenses,
                    incomeData.administrative_expenses,
                    incomeData.financial_expenses,
                    incomeData.operating_profit,
                    incomeData.non_operating_income,
                    incomeData.non_operating_expenses,
                    incomeData.total_profit,
                    incomeData.income_tax_expense,
                    incomeData.net_profit,
                    existingData.id
                );
                operation = '更新';
            }
        } else {
            const stmt = this.db.db.prepare(`
                INSERT INTO income_statements (
                    company_id, period_year, period_month, period_quarter, period, operating_revenue, 
                    operating_costs, taxes_and_surcharges, selling_expenses, administrative_expenses, 
                    financial_expenses, operating_profit, non_operating_income, non_operating_expenses, 
                    total_profit, income_tax_expense, net_profit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                companyId,
                incomeData.period_year,
                incomeData.period_month,
                incomeData.period_quarter,
                incomeData.period,
                incomeData.operating_revenue,
                incomeData.operating_costs,
                incomeData.taxes_and_surcharges,
                incomeData.selling_expenses,
                incomeData.administrative_expenses,
                incomeData.financial_expenses,
                incomeData.operating_profit,
                incomeData.non_operating_income,
                incomeData.non_operating_expenses,
                incomeData.total_profit,
                incomeData.income_tax_expense,
                incomeData.net_profit
            );
            operation = '导入';
        }

        return {
            message: `利润表${operation}成功 (${incomeData.period_year}年${incomeData.period_month}月)`,
            data: incomeData
        };
    }

    // 修改：处理税务申报 - 支持多年数据导入策略
    async processTaxReports(companyId, buffer, importStrategy = 'append') {
        const taxReports = excelParser.parseTaxReports(buffer);

        if (taxReports.length === 0) {
            throw new Error('税务申报数据为空');
        }

        const processedPeriods = [];
        let insertCount = 0;
        let updateCount = 0;
        let skipCount = 0;

        for (const report of taxReports) {
            const periodKey = `${report.period_year}-${report.period_month}-${report.tax_type}`;

            const existingData = this.db.db.prepare(`
                SELECT id FROM tax_reports 
                WHERE company_id = ? AND period_year = ? AND period_month = ? AND tax_type = ?
            `).get(companyId, report.period_year, report.period_month, report.tax_type);

            if (existingData) {
                if (importStrategy === 'skip') {
                    console.log(`跳过重复数据: ${periodKey}`);
                    skipCount++;
                    continue;
                } else if (importStrategy === 'update' || importStrategy === 'append') {
                    // 更新现有数据
                    const stmt = this.db.db.prepare(`
                        UPDATE tax_reports SET
                            period = ?, taxable_amount = ?, paid_amount = ?, refund_amount = ?, tax_rate = ?
                        WHERE id = ?
                    `);
                    stmt.run(
                        report.period,
                        report.taxable_amount,
                        report.paid_amount,
                        report.refund_amount,
                        report.tax_rate,
                        existingData.id
                    );
                    updateCount++;
                }
            } else {
                // 插入新数据
                const stmt = this.db.db.prepare(`
                    INSERT INTO tax_reports (
                        company_id, period_year, period_month, tax_type, period, taxable_amount, 
                        paid_amount, refund_amount, tax_rate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(
                    companyId,
                    report.period_year,
                    report.period_month,
                    report.tax_type,
                    report.period,
                    report.taxable_amount,
                    report.paid_amount,
                    report.refund_amount,
                    report.tax_rate
                );
                insertCount++;
            }

            const periodDisplay = `${report.period_year}-${report.period_month}`;
            if (!processedPeriods.includes(periodDisplay)) {
                processedPeriods.push(periodDisplay);
            }
        }

        let message = `税务申报数据处理完成 (${processedPeriods.join('、')})`;
        if (insertCount > 0) message += ` - 新增 ${insertCount} 条`;
        if (updateCount > 0) message += ` - 更新 ${updateCount} 条`;
        if (skipCount > 0) message += ` - 跳过 ${skipCount} 条`;

        return {
            message: message,
            data: {
                total: taxReports.length,
                inserted: insertCount,
                updated: updateCount,
                skipped: skipCount,
                periods: processedPeriods
            }
        };
    }

    // 修改：处理发票数据 - 支持多年数据导入策略
    async processInvoiceData(companyId, buffer, importStrategy = 'append') {
        const invoiceData = excelParser.parseInvoiceData(buffer);

        let insertCount = 0;
        let updateCount = 0;
        let skipCount = 0;
        let processedPeriod = '';

        if (invoiceData.length > 0) {
            const samplePeriod = invoiceData[0];
            processedPeriod = `${samplePeriod.period_year}年${samplePeriod.period_month}月`;

            if (importStrategy === 'skip') {
                // 检查是否已有该期间的数据
                const existingCount = this.db.db.prepare(`
                    SELECT COUNT(*) as count FROM invoices 
                    WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).get(companyId, samplePeriod.period_year, samplePeriod.period_month);

                if (existingCount.count > 0) {
                    console.log(`跳过重复的发票数据: ${processedPeriod}`);
                    return {
                        message: `跳过重复数据 (${processedPeriod})`,
                        data: { count: 0, skipped: invoiceData.length }
                    };
                }
            } else if (importStrategy === 'update') {
                // 删除该期间的现有数据，重新插入
                this.db.db.prepare(`
                    DELETE FROM invoices WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).run(companyId, samplePeriod.period_year, samplePeriod.period_month);
            }

            const stmt = this.db.db.prepare(`
                INSERT INTO invoices (
                    company_id, period_year, period_month, invoice_type, amount, tax_amount
                ) VALUES (?, ?, ?, ?, ?, ?)
            `);

            const insertMany = this.db.db.transaction((invoices) => {
                for (const invoice of invoices) {
                    stmt.run(
                        companyId,
                        invoice.period_year,
                        invoice.period_month,
                        invoice.invoice_type,
                        invoice.invoice_amount,
                        invoice.tax_amount
                    );
                    insertCount++;
                }
            });

            insertMany(invoiceData);
        }

        return {
            message: `发票数据导入成功${processedPeriod ? ` (${processedPeriod})` : ''}`,
            data: { count: insertCount }
        };
    }

    // 修改：处理人事工资数据 - 支持多年数据导入策略
    async processHRSalaryData(companyId, buffer, importStrategy = 'append') {
        const hrData = excelParser.parseHRSalaryData(buffer);

        let insertCount = 0;
        let updateCount = 0;
        let skipCount = 0;
        let processedPeriod = '';

        if (hrData.length > 0) {
            const samplePeriod = hrData[0];
            processedPeriod = `${samplePeriod.period_year}年${samplePeriod.period_month}月`;

            if (importStrategy === 'skip') {
                // 检查是否已有该期间的数据
                const existingCount = this.db.db.prepare(`
                    SELECT COUNT(*) as count FROM hr_salary_data 
                    WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).get(companyId, samplePeriod.period_year, samplePeriod.period_month);

                if (existingCount.count > 0) {
                    console.log(`跳过重复的人事薪酬数据: ${processedPeriod}`);
                    return {
                        message: `跳过重复数据 (${processedPeriod})`,
                        data: { count: 0, skipped: hrData.length }
                    };
                }
            } else if (importStrategy === 'update') {
                // 删除该期间的现有数据，重新插入
                this.db.db.prepare(`
                    DELETE FROM hr_salary_data WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).run(companyId, samplePeriod.period_year, samplePeriod.period_month);
            }

            const stmt = this.db.db.prepare(`
                INSERT INTO hr_salary_data (
                    company_id, period_year, period_month, department, employee_count, 
                    average_salary, social_insurance_base, housing_fund_base
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMany = this.db.db.transaction((hrRecords) => {
                for (const record of hrRecords) {
                    stmt.run(
                        companyId,
                        record.period_year,
                        record.period_month,
                        record.department,
                        record.employee_count,
                        record.average_salary,
                        record.social_insurance_base,
                        record.housing_fund_base
                    );
                    insertCount++;
                }
            });

            insertMany(hrData);
        }

        return {
            message: `人事工资数据导入成功${processedPeriod ? ` (${processedPeriod})` : ''}`,
            data: { count: insertCount }
        };
    }

    // 修改：处理科目余额表 - 支持多年数据导入策略
    async processAccountBalance(companyId, buffer, importStrategy = 'append') {
        const accountData = excelParser.parseAccountBalance(buffer);

        let insertCount = 0;
        let updateCount = 0;
        let skipCount = 0;
        let processedPeriod = '';

        if (accountData.length > 0) {
            const samplePeriod = accountData[0];
            processedPeriod = `${samplePeriod.period_year}年${samplePeriod.period_month}月`;

            if (importStrategy === 'skip') {
                // 检查是否已有该期间的数据
                const existingCount = this.db.db.prepare(`
                    SELECT COUNT(*) as count FROM account_balances 
                    WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).get(companyId, samplePeriod.period_year, samplePeriod.period_month);

                if (existingCount.count > 0) {
                    console.log(`跳过重复的科目余额数据: ${processedPeriod}`);
                    return {
                        message: `跳过重复数据 (${processedPeriod})`,
                        data: { count: 0, skipped: accountData.length }
                    };
                }
            } else if (importStrategy === 'update') {
                // 删除该期间的现有数据，重新插入
                this.db.db.prepare(`
                    DELETE FROM account_balances WHERE company_id = ? AND period_year = ? AND period_month = ?
                `).run(companyId, samplePeriod.period_year, samplePeriod.period_month);
            }

            const stmt = this.db.db.prepare(`
                INSERT INTO account_balances (
                    company_id, period_year, period_month, account_code, account_name, 
                    opening_balance, debit_amount, credit_amount, ending_balance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMany = this.db.db.transaction((accounts) => {
                for (const account of accounts) {
                    stmt.run(
                        companyId,
                        account.period_year,
                        account.period_month,
                        account.account_code,
                        account.account_name,
                        account.opening_balance,
                        account.debit_amount,
                        account.credit_amount,
                        account.ending_balance
                    );
                    insertCount++;
                }
            });

            insertMany(accountData);
        }

        return {
            message: `科目余额表导入成功${processedPeriod ? ` (${processedPeriod})` : ''}`,
            data: { count: insertCount }
        };
    }

    // 原有的单个文件上传方法保持不变，以确保向后兼容性
    uploadCompanyInfo = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processCompanyInfo(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传企业信息失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传企业信息失败: ' + error.message
            });
        }
    }

    uploadBalanceSheet = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processBalanceSheet(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传资产负债表失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传资产负债表失败: ' + error.message
            });
        }
    }

    uploadIncomeStatement = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processIncomeStatement(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传利润表失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传利润表失败: ' + error.message
            });
        }
    }

    uploadTaxReports = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processTaxReports(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传纳税申报数据失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传纳税申报数据失败: ' + error.message
            });
        }
    }

    uploadInvoiceData = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processInvoiceData(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传发票数据失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传发票数据失败: ' + error.message
            });
        }
    }

    uploadHRSalaryData = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processHRSalaryData(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传人事工资数据失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传人事工资数据失败: ' + error.message
            });
        }
    }

    uploadAccountBalance = async (req, res) => {
        try {
            const { companyId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的文件'
                });
            }

            const buffer = fs.readFileSync(file.path);
            const result = await this.processAccountBalance(companyId, buffer);

            fs.unlinkSync(file.path);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error) {
            console.error('上传科目余额表失败:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: '上传科目余额表失败: ' + error.message
            });
        }
    }
}

module.exports = new UploadController();