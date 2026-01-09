/**
 * 示例数据生成主脚本
 * 为4家企业生成2022-2024全年及2025年Q1的完整财务数据
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// 导入生成器
const companyProfiles = require('./dataGenerators/companyProfiles');
const BalanceSheetGenerator = require('./dataGenerators/balanceSheetGenerator');
const IncomeStatementGenerator = require('./dataGenerators/incomeStatementGenerator');
const TaxReportGenerator = require('./dataGenerators/taxReportGenerator');
const InvoiceGenerator = require('./dataGenerators/invoiceGenerator');
const HRDataGenerator = require('./dataGenerators/hrDataGenerator');
const AccountBalanceGenerator = require('./dataGenerators/accountBalanceGenerator');

class SampleDataGenerator {
    constructor() {
        // 连接数据库
        const dbPath = path.join(__dirname, '../database/financial.db');
        this.db = new Database(dbPath);

        // 生成期间列表: 2022-2024全年 + 2025 Q1
        this.periods = this.generatePeriods();

        console.log(`将为${Object.keys(companyProfiles).length}家企业生成${this.periods.length}个期间的数据`);
    }

    /**
     * 生成期间列表
     */
    generatePeriods() {
        const periods = [];

        // 2022-2024年，每年4个季度
        for (let year = 2022; year <= 2024; year++) {
            for (let quarter = 1; quarter <= 4; quarter++) {
                periods.push({ year, quarter });
            }
        }

        // 2025年第1季度
        periods.push({ year: 2025, quarter: 1 });

        return periods;
    }

    /**
     * 备份数据库
     */
    backupDatabase() {
        const dbPath = path.join(__dirname, '../database/financial.db');
        const backupPath = path.join(__dirname, '../database/financial_backup_' + Date.now() + '.db');

        console.log('正在备份数据库...');
        fs.copyFileSync(dbPath, backupPath);
        console.log(`数据库已备份到: ${backupPath}`);
    }

    /**
     * 清除旧的示例数据
     */
    clearOldData() {
        console.log('\n正在清除旧数据...');

        const companyIds = Object.keys(companyProfiles).map(id => parseInt(id));
        const placeholders = companyIds.map(() => '?').join(',');

        const tables = [
            'balance_sheets',
            'income_statements',
            'tax_reports',
            'invoices',
            'hr_salary_data',
            'account_balances'
        ];

        const transaction = this.db.transaction(() => {
            tables.forEach(table => {
                const result = this.db.prepare(
                    `DELETE FROM ${table} WHERE company_id IN (${placeholders})`
                ).run(...companyIds);

                console.log(`  ${table}: 删除了 ${result.changes} 条记录`);
            });
        });

        transaction();
    }

    /**
     * 更新企业基础信息
     */
    updateCompanyInfo() {
        console.log('\n正在更新企业基础信息...');

        const updateStmt = this.db.prepare(`
            UPDATE companies 
            SET industry = ?, industry_code = ?
            WHERE id = ?
        `);

        Object.values(companyProfiles).forEach(profile => {
            updateStmt.run(profile.industry, profile.industryCode, profile.id);
            console.log(`  更新企业 ${profile.id}: ${profile.name}`);
        });
    }

    /**
     * 为单个企业生成所有数据
     */
    generateCompanyData(companyProfile) {
        console.log(`\n正在为 ${companyProfile.name} 生成数据...`);

        // 1. 生成资产负债表
        console.log('  生成资产负债表...');
        const balanceSheets = BalanceSheetGenerator.generateMultiple(companyProfile, this.periods);

        // 2. 生成利润表
        console.log('  生成利润表...');
        const incomeStatements = IncomeStatementGenerator.generateMultiple(companyProfile, this.periods);

        // 3. 生成税务申报（需要利润表数据）
        console.log('  生成税务申报...');
        const taxReports = TaxReportGenerator.generateMultiple(companyProfile, this.periods, incomeStatements);

        // 4. 生成发票数据（需要利润表数据）
        console.log('  生成发票数据...');
        const invoices = InvoiceGenerator.generateMultiple(companyProfile, this.periods, incomeStatements);

        // 5. 生成人事薪酬数据
        console.log('  生成人事薪酬数据...');
        const hrData = HRDataGenerator.generateMultiple(companyProfile, this.periods);

        // 6. 生成科目余额（需要资产负债表数据）
        console.log('  生成科目余额...');
        const accountBalances = AccountBalanceGenerator.generateMultiple(companyProfile, this.periods, balanceSheets);

        return {
            balanceSheets,
            incomeStatements,
            taxReports,
            invoices,
            hrData,
            accountBalances
        };
    }

    /**
     * 批量插入数据
     */
    insertData(tableName, data, columns) {
        if (data.length === 0) return;

        const placeholders = columns.map(() => '?').join(', ');
        const insertStmt = this.db.prepare(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
        );

        const insertMany = this.db.transaction((records) => {
            for (const record of records) {
                const values = columns.map(col => record[col]);
                insertStmt.run(...values);
            }
        });

        insertMany(data);
        console.log(`  ${tableName}: 插入了 ${data.length} 条记录`);
    }

    /**
     * 执行数据生成
     */
    async run() {
        console.log('========================================');
        console.log('企业画像示例数据生成工具');
        console.log('========================================');

        try {
            // 1. 备份数据库
            this.backupDatabase();

            // 2. 更新企业基础信息
            this.updateCompanyInfo();

            // 3. 清除旧数据
            this.clearOldData();

            // 4. 为每家企业生成数据
            const allData = {
                balanceSheets: [],
                incomeStatements: [],
                taxReports: [],
                invoices: [],
                hrData: [],
                accountBalances: []
            };

            for (const companyProfile of Object.values(companyProfiles)) {
                const companyData = this.generateCompanyData(companyProfile);

                allData.balanceSheets.push(...companyData.balanceSheets);
                allData.incomeStatements.push(...companyData.incomeStatements);
                allData.taxReports.push(...companyData.taxReports);
                allData.invoices.push(...companyData.invoices);
                allData.hrData.push(...companyData.hrData);
                allData.accountBalances.push(...companyData.accountBalances);
            }

            // 5. 批量插入数据
            console.log('\n正在插入数据到数据库...');

            this.insertData('balance_sheets', allData.balanceSheets, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'period_end_date',
                'cash_and_equivalents', 'trading_financial_assets', 'accounts_receivable', 'prepayments',
                'other_receivables', 'inventory', 'current_assets_total', 'long_term_equity_investment',
                'fixed_assets', 'accumulated_depreciation', 'intangible_assets', 'accumulated_amortization',
                'non_current_assets_total', 'total_assets', 'short_term_loans', 'accounts_payable',
                'employee_benefits_payable', 'taxes_payable', 'current_liabilities_total', 'long_term_loans',
                'non_current_liabilities_total', 'total_liabilities', 'paid_in_capital', 'capital_surplus',
                'surplus_reserves', 'retained_earnings', 'total_equity'
            ]);

            this.insertData('income_statements', allData.incomeStatements, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'period', 'report_date',
                'operating_revenue', 'operating_costs', 'taxes_and_surcharges', 'selling_expenses',
                'administrative_expenses', 'financial_expenses', 'operating_profit', 'non_operating_income',
                'non_operating_expenses', 'total_profit', 'income_tax_expense', 'net_profit'
            ]);

            this.insertData('tax_reports', allData.taxReports, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'tax_type', 'period',
                'report_date', 'taxable_amount', 'paid_amount', 'refund_amount', 'tax_rate',
                'vat_payable', 'income_tax_payable'
            ]);

            this.insertData('invoices', allData.invoices, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'invoice_number',
                'invoice_type', 'amount', 'tax_amount', 'issue_date', 'buyer_name', 'seller_name'
            ]);

            this.insertData('hr_salary_data', allData.hrData, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'department',
                'employee_count', 'average_salary', 'social_insurance_base', 'housing_fund_base'
            ]);

            this.insertData('account_balances', allData.accountBalances, [
                'company_id', 'period_year', 'period_month', 'period_quarter', 'account_code',
                'account_name', 'opening_balance', 'debit_amount', 'credit_amount', 'ending_balance'
            ]);

            // 6. 统计信息
            console.log('\n========================================');
            console.log('数据生成完成！统计信息:');
            console.log('========================================');
            console.log(`企业数量: ${Object.keys(companyProfiles).length}`);
            console.log(`期间数量: ${this.periods.length}`);
            console.log(`资产负债表: ${allData.balanceSheets.length} 条`);
            console.log(`利润表: ${allData.incomeStatements.length} 条`);
            console.log(`税务申报: ${allData.taxReports.length} 条`);
            console.log(`发票数据: ${allData.invoices.length} 条`);
            console.log(`人事薪酬: ${allData.hrData.length} 条`);
            console.log(`科目余额: ${allData.accountBalances.length} 条`);
            console.log(`总记录数: ${allData.balanceSheets.length +
                allData.incomeStatements.length +
                allData.taxReports.length +
                allData.invoices.length +
                allData.hrData.length +
                allData.accountBalances.length
                } 条`);
            console.log('========================================');

        } catch (error) {
            console.error('\n数据生成失败:', error);
            throw error;
        } finally {
            this.db.close();
        }
    }
}

// 执行数据生成
if (require.main === module) {
    const generator = new SampleDataGenerator();
    generator.run().catch(error => {
        console.error('执行失败:', error);
        process.exit(1);
    });
}

module.exports = SampleDataGenerator;
