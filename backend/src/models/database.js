const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        // 创建数据库文件夹
        const dbDir = path.join(__dirname, '../../database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.dbPath = path.join(dbDir, 'financial.db');
        this.db = new Database(this.dbPath);

        // 启用外键约束
        this.db.pragma('foreign_keys = ON');

        this.initializeTables();
    }

    initializeTables() {
        console.log('开始初始化数据库表...');

        // 企业表 - 修复税号唯一约束问题
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                tax_code TEXT UNIQUE,
                company_type TEXT,
                legal_person TEXT,
                registered_capital REAL,
                establishment_date TEXT,
                business_term TEXT,
                address TEXT,
                business_scope TEXT,
                industry TEXT,
                industry_code TEXT,
                company_scale TEXT,
                employee_count INTEGER,
                shareholder_info TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 更新现有表结构
        this.updateExistingTables();

        console.log('数据库表初始化完成');
    }

    updateExistingTables() {
        try {
            console.log('检查并更新现有表结构...');

            // 检查和更新资产负债表
            this.updateBalanceSheetsTable();

            // 检查和更新利润表
            this.updateIncomeStatementsTable();

            // 检查和更新税务申报表 - 重点修复
            this.updateTaxReportsTable();

            // 检查和更新发票表 - 重点修复
            this.updateInvoicesTable();

            // 检查和更新人事薪酬表 - 重点修复
            this.updateHRSalaryTable();

            // 检查和更新科目余额表 - 重点修复
            this.updateAccountBalancesTable();

        } catch (error) {
            console.error('更新表结构失败:', error);
        }
    }

    updateBalanceSheetsTable() {
        try {
            // 检查表是否存在
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='balance_sheets'
            `).get();

            if (tableExists) {
                // 检查是否有新字段
                const columnInfo = this.db.pragma('table_info(balance_sheets)');
                const columnNames = columnInfo.map(col => col.name);

                const needsUpdate = !columnNames.includes('period_year');

                if (needsUpdate) {
                    console.log('重建资产负债表以添加期间字段...');

                    // 备份现有数据
                    const existingData = this.db.prepare('SELECT * FROM balance_sheets').all();

                    // 删除旧表
                    this.db.exec('DROP TABLE balance_sheets');

                    // 创建新表
                    this.db.exec(`
                        CREATE TABLE balance_sheets (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            company_id INTEGER,
                            period_year INTEGER DEFAULT ${new Date().getFullYear()},
                            period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                            period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                            period_end_date TEXT,
                            report_date TEXT,
                            cash_and_equivalents REAL DEFAULT 0,
                            trading_financial_assets REAL DEFAULT 0,
                            accounts_receivable REAL DEFAULT 0,
                            prepayments REAL DEFAULT 0,
                            other_receivables REAL DEFAULT 0,
                            inventory REAL DEFAULT 0,
                            current_assets REAL DEFAULT 0,
                            current_assets_total REAL DEFAULT 0,
                            long_term_equity_investment REAL DEFAULT 0,
                            fixed_assets REAL DEFAULT 0,
                            accumulated_depreciation REAL DEFAULT 0,
                            intangible_assets REAL DEFAULT 0,
                            accumulated_amortization REAL DEFAULT 0,
                            non_current_assets REAL DEFAULT 0,
                            non_current_assets_total REAL DEFAULT 0,
                            total_assets REAL DEFAULT 0,
                            short_term_loans REAL DEFAULT 0,
                            accounts_payable REAL DEFAULT 0,
                            employee_benefits_payable REAL DEFAULT 0,
                            taxes_payable REAL DEFAULT 0,
                            current_liabilities REAL DEFAULT 0,
                            current_liabilities_total REAL DEFAULT 0,
                            long_term_loans REAL DEFAULT 0,
                            non_current_liabilities REAL DEFAULT 0,
                            non_current_liabilities_total REAL DEFAULT 0,
                            total_liabilities REAL DEFAULT 0,
                            paid_in_capital REAL DEFAULT 0,
                            capital_surplus REAL DEFAULT 0,
                            surplus_reserves REAL DEFAULT 0,
                            retained_earnings REAL DEFAULT 0,
                            total_equity REAL DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (company_id) REFERENCES companies (id)
                        )
                    `);

                    // 恢复数据，为旧数据设置默认期间
                    if (existingData.length > 0) {
                        const insertStmt = this.db.prepare(`
                            INSERT INTO balance_sheets (
                                company_id, period_year, period_month, period_quarter, period_end_date,
                                cash_and_equivalents, trading_financial_assets, accounts_receivable, prepayments,
                                other_receivables, inventory, current_assets_total, long_term_equity_investment,
                                fixed_assets, accumulated_depreciation, intangible_assets, accumulated_amortization,
                                non_current_assets_total, total_assets, short_term_loans, accounts_payable,
                                employee_benefits_payable, taxes_payable, current_liabilities_total, long_term_loans,
                                non_current_liabilities_total, total_liabilities, paid_in_capital, capital_surplus,
                                surplus_reserves, retained_earnings, total_equity, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);

                        for (const row of existingData) {
                            insertStmt.run(
                                row.company_id,
                                2024, // 默认年份
                                12,   // 默认月份
                                4,    // 默认季度
                                row.period_end_date,
                                row.cash_and_equivalents || 0,
                                row.trading_financial_assets || 0,
                                row.accounts_receivable || 0,
                                row.prepayments || 0,
                                row.other_receivables || 0,
                                row.inventory || 0,
                                row.current_assets_total || 0,
                                row.long_term_equity_investment || 0,
                                row.fixed_assets || 0,
                                row.accumulated_depreciation || 0,
                                row.intangible_assets || 0,
                                row.accumulated_amortization || 0,
                                row.non_current_assets_total || 0,
                                row.total_assets || 0,
                                row.short_term_loans || 0,
                                row.accounts_payable || 0,
                                row.employee_benefits_payable || 0,
                                row.taxes_payable || 0,
                                row.current_liabilities_total || 0,
                                row.long_term_loans || 0,
                                row.non_current_liabilities_total || 0,
                                row.total_liabilities || 0,
                                row.paid_in_capital || 0,
                                row.capital_surplus || 0,
                                row.surplus_reserves || 0,
                                row.retained_earnings || 0,
                                row.total_equity || 0,
                                row.created_at
                            );
                        }
                        console.log(`恢复了 ${existingData.length} 条资产负债表数据`);
                    }
                }
            } else {
                // 创建新表
                this.db.exec(`
                    CREATE TABLE balance_sheets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        period_end_date TEXT,
                        report_date TEXT,
                        cash_and_equivalents REAL DEFAULT 0,
                        trading_financial_assets REAL DEFAULT 0,
                        accounts_receivable REAL DEFAULT 0,
                        prepayments REAL DEFAULT 0,
                        other_receivables REAL DEFAULT 0,
                        inventory REAL DEFAULT 0,
                        current_assets REAL DEFAULT 0,
                        current_assets_total REAL DEFAULT 0,
                        long_term_equity_investment REAL DEFAULT 0,
                        fixed_assets REAL DEFAULT 0,
                        accumulated_depreciation REAL DEFAULT 0,
                        intangible_assets REAL DEFAULT 0,
                        accumulated_amortization REAL DEFAULT 0,
                        non_current_assets REAL DEFAULT 0,
                        non_current_assets_total REAL DEFAULT 0,
                        total_assets REAL DEFAULT 0,
                        short_term_loans REAL DEFAULT 0,
                        accounts_payable REAL DEFAULT 0,
                        employee_benefits_payable REAL DEFAULT 0,
                        taxes_payable REAL DEFAULT 0,
                        current_liabilities REAL DEFAULT 0,
                        current_liabilities_total REAL DEFAULT 0,
                        long_term_loans REAL DEFAULT 0,
                        non_current_liabilities REAL DEFAULT 0,
                        non_current_liabilities_total REAL DEFAULT 0,
                        total_liabilities REAL DEFAULT 0,
                        paid_in_capital REAL DEFAULT 0,
                        capital_surplus REAL DEFAULT 0,
                        surplus_reserves REAL DEFAULT 0,
                        retained_earnings REAL DEFAULT 0,
                        total_equity REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新资产负债表失败:', error);
        }
    }

    updateIncomeStatementsTable() {
        try {
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='income_statements'
            `).get();

            if (tableExists) {
                const columnInfo = this.db.pragma('table_info(income_statements)');
                const columnNames = columnInfo.map(col => col.name);

                const needsUpdate = !columnNames.includes('period_year');

                if (needsUpdate) {
                    console.log('重建利润表以添加期间字段...');

                    // 备份现有数据
                    const existingData = this.db.prepare('SELECT * FROM income_statements').all();

                    // 删除旧表
                    this.db.exec('DROP TABLE income_statements');

                    // 创建新表
                    this.db.exec(`
                        CREATE TABLE income_statements (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            company_id INTEGER,
                            period_year INTEGER DEFAULT ${new Date().getFullYear()},
                            period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                            period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                            period TEXT,
                            report_date TEXT,
                            total_revenue REAL DEFAULT 0,
                            cost_of_sales REAL DEFAULT 0,
                            gross_profit REAL DEFAULT 0,
                            operating_revenue REAL DEFAULT 0,
                            operating_costs REAL DEFAULT 0,
                            taxes_and_surcharges REAL DEFAULT 0,
                            selling_expenses REAL DEFAULT 0,
                            administrative_expenses REAL DEFAULT 0,
                            financial_expenses REAL DEFAULT 0,
                            operating_profit REAL DEFAULT 0,
                            non_operating_income REAL DEFAULT 0,
                            non_operating_expenses REAL DEFAULT 0,
                            total_profit REAL DEFAULT 0,
                            income_tax_expense REAL DEFAULT 0,
                            net_profit REAL DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (company_id) REFERENCES companies (id)
                        )
                    `);

                    // 恢复数据
                    if (existingData.length > 0) {
                        const insertStmt = this.db.prepare(`
                            INSERT INTO income_statements (
                                company_id, period_year, period_month, period_quarter, period, operating_revenue,
                                operating_costs, taxes_and_surcharges, selling_expenses, administrative_expenses,
                                financial_expenses, operating_profit, non_operating_income, non_operating_expenses,
                                total_profit, income_tax_expense, net_profit, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);

                        for (const row of existingData) {
                            insertStmt.run(
                                row.company_id,
                                2024, // 默认年份
                                12,   // 默认月份
                                4,    // 默认季度
                                row.period || '2024年',
                                row.operating_revenue || 0,
                                row.operating_costs || 0,
                                row.taxes_and_surcharges || 0,
                                row.selling_expenses || 0,
                                row.administrative_expenses || 0,
                                row.financial_expenses || 0,
                                row.operating_profit || 0,
                                row.non_operating_income || 0,
                                row.non_operating_expenses || 0,
                                row.total_profit || 0,
                                row.income_tax_expense || 0,
                                row.net_profit || 0,
                                row.created_at
                            );
                        }
                        console.log(`恢复了 ${existingData.length} 条利润表数据`);
                    }
                }
            } else {
                // 创建新表
                this.db.exec(`
                    CREATE TABLE income_statements (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        period TEXT,
                        report_date TEXT,
                        total_revenue REAL DEFAULT 0,
                        cost_of_sales REAL DEFAULT 0,
                        gross_profit REAL DEFAULT 0,
                        operating_revenue REAL DEFAULT 0,
                        operating_costs REAL DEFAULT 0,
                        taxes_and_surcharges REAL DEFAULT 0,
                        selling_expenses REAL DEFAULT 0,
                        administrative_expenses REAL DEFAULT 0,
                        financial_expenses REAL DEFAULT 0,
                        operating_profit REAL DEFAULT 0,
                        non_operating_income REAL DEFAULT 0,
                        non_operating_expenses REAL DEFAULT 0,
                        total_profit REAL DEFAULT 0,
                        income_tax_expense REAL DEFAULT 0,
                        net_profit REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新利润表失败:', error);
        }
    }

    updateTaxReportsTable() {
        try {
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='tax_reports'
            `).get();

            if (tableExists) {
                const columnInfo = this.db.pragma('table_info(tax_reports)');
                const columnNames = columnInfo.map(col => col.name);

                const needsUpdate = !columnNames.includes('period_quarter');

                if (needsUpdate) {
                    console.log('重建税务申报表以添加完整期间字段...');

                    const existingData = this.db.prepare('SELECT * FROM tax_reports').all();
                    this.db.exec('DROP TABLE tax_reports');

                    this.db.exec(`
                        CREATE TABLE tax_reports (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            company_id INTEGER,
                            period_year INTEGER DEFAULT ${new Date().getFullYear()},
                            period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                            period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                            tax_type TEXT,
                            period TEXT,
                            report_date TEXT,
                            taxable_amount REAL DEFAULT 0,
                            paid_amount REAL DEFAULT 0,
                            refund_amount REAL DEFAULT 0,
                            tax_rate REAL DEFAULT 0,
                            vat_payable REAL DEFAULT 0,
                            income_tax_payable REAL DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (company_id) REFERENCES companies (id)
                        )
                    `);

                    if (existingData.length > 0) {
                        const insertStmt = this.db.prepare(`
                            INSERT INTO tax_reports (
                                company_id, period_year, period_month, period_quarter, tax_type, period, taxable_amount,
                                paid_amount, refund_amount, tax_rate, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);

                        for (const row of existingData) {
                            insertStmt.run(
                                row.company_id,
                                row.period_year || 2024,
                                row.period_month || 12,
                                Math.ceil((row.period_month || 12) / 3),
                                row.tax_type,
                                row.period || '2024-12-01',
                                row.taxable_amount || 0,
                                row.paid_amount || 0,
                                row.refund_amount || 0,
                                row.tax_rate || 0,
                                row.created_at
                            );
                        }
                        console.log(`恢复了 ${existingData.length} 条税务申报数据`);
                    }
                }
            } else {
                this.db.exec(`
                    CREATE TABLE tax_reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        tax_type TEXT,
                        period TEXT,
                        report_date TEXT,
                        taxable_amount REAL DEFAULT 0,
                        paid_amount REAL DEFAULT 0,
                        refund_amount REAL DEFAULT 0,
                        tax_rate REAL DEFAULT 0,
                        vat_payable REAL DEFAULT 0,
                        income_tax_payable REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新税务申报表失败:', error);
        }
    }

    updateInvoicesTable() {
        try {
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'
            `).get();

            if (tableExists) {
                const columnInfo = this.db.pragma('table_info(invoices)');
                const columnNames = columnInfo.map(col => col.name);

                if (!columnNames.includes('period_quarter')) {
                    console.log('更新发票表结构...');
                    this.db.exec('ALTER TABLE invoices ADD COLUMN period_quarter INTEGER DEFAULT 4');
                }
            } else {
                this.db.exec(`
                    CREATE TABLE invoices (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        invoice_number TEXT,
                        invoice_type TEXT,
                        amount REAL DEFAULT 0,
                        tax_amount REAL DEFAULT 0,
                        issue_date TEXT,
                        buyer_name TEXT,
                        seller_name TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新发票表失败:', error);
        }
    }

    updateHRSalaryTable() {
        try {
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='hr_salary_data'
            `).get();

            if (tableExists) {
                const columnInfo = this.db.pragma('table_info(hr_salary_data)');
                const columnNames = columnInfo.map(col => col.name);

                if (!columnNames.includes('period_quarter')) {
                    console.log('更新人事薪酬表结构...');
                    this.db.exec('ALTER TABLE hr_salary_data ADD COLUMN period_quarter INTEGER DEFAULT 4');
                }
            } else {
                this.db.exec(`
                    CREATE TABLE hr_salary_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        department TEXT,
                        employee_count INTEGER DEFAULT 0,
                        average_salary REAL DEFAULT 0,
                        social_insurance_base REAL DEFAULT 0,
                        housing_fund_base REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新人事薪酬表失败:', error);
        }
    }

    updateAccountBalancesTable() {
        try {
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='account_balances'
            `).get();

            if (tableExists) {
                const columnInfo = this.db.pragma('table_info(account_balances)');
                const columnNames = columnInfo.map(col => col.name);

                if (!columnNames.includes('period_quarter')) {
                    console.log('更新科目余额表结构...');
                    this.db.exec('ALTER TABLE account_balances ADD COLUMN period_quarter INTEGER DEFAULT 4');
                }
            } else {
                this.db.exec(`
                    CREATE TABLE account_balances (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        period_year INTEGER DEFAULT ${new Date().getFullYear()},
                        period_month INTEGER DEFAULT ${new Date().getMonth() + 1},
                        period_quarter INTEGER DEFAULT ${Math.ceil((new Date().getMonth() + 1) / 3)},
                        account_code TEXT,
                        account_name TEXT,
                        opening_balance REAL DEFAULT 0,
                        debit_amount REAL DEFAULT 0,
                        credit_amount REAL DEFAULT 0,
                        ending_balance REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }

            // 创建员工表（如果不存在）
            const employeesTableExists = this.db.prepare(`
                SELECT name FROM sqlite_master WHERE type='table' AND name='employees'
            `).get();

            if (!employeesTableExists) {
                this.db.exec(`
                    CREATE TABLE employees (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_id INTEGER,
                        name TEXT,
                        department TEXT,
                        position TEXT,
                        salary REAL DEFAULT 0,
                        hire_date TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (company_id) REFERENCES companies (id)
                    )
                `);
            }
        } catch (error) {
            console.error('更新科目余额表失败:', error);
        }
    }

    // 兼容 sqlite3 的 API
    all(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(params);
            callback(null, rows);
        } catch (error) {
            callback(error);
        }
    }

    get(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            const stmt = this.db.prepare(sql);
            const row = stmt.get(params);
            callback(null, row);
        } catch (error) {
            callback(error);
        }
    }

    run(sql, params = [], callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.run(params);
            // 模拟 sqlite3 的回调上下文
            const context = {
                lastID: result.lastInsertRowid,
                changes: result.changes
            };
            callback.call(context, null);
        } catch (error) {
            callback(error);
        }
    }

    getDatabase() {
        return this;
    }

    close() {
        this.db.close();
    }
}

// 创建单例实例
const dbManager = new DatabaseManager();
module.exports = dbManager;