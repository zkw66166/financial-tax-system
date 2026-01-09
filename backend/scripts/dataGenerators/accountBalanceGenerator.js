/**
 * 科目余额数据生成器
 */

const RandomHelper = require('../utils/randomHelper');

class AccountBalanceGenerator {
    /**
     * 生成指定期间的科目余额数据
     */
    static generate(companyProfile, year, quarter, balanceSheet) {
        const { id } = companyProfile;

        if (!balanceSheet) return [];

        // 主要会计科目配置
        const accounts = this.getAccountStructure();

        const accountBalances = [];

        accounts.forEach(account => {
            // 根据资产负债表数据计算科目余额
            const balance = this.calculateAccountBalance(account, balanceSheet);

            if (balance.ending_balance !== 0) {
                accountBalances.push({
                    company_id: id,
                    period_year: year,
                    period_month: quarter * 3,
                    period_quarter: quarter,
                    account_code: account.code,
                    account_name: account.name,
                    opening_balance: Math.round(balance.opening_balance),
                    debit_amount: Math.round(balance.debit_amount),
                    credit_amount: Math.round(balance.credit_amount),
                    ending_balance: Math.round(balance.ending_balance)
                });
            }
        });

        return accountBalances;
    }

    /**
     * 获取会计科目结构
     */
    static getAccountStructure() {
        return [
            // 资产类
            { code: '1001', name: '库存现金', type: 'asset', source: 'cash_and_equivalents', ratio: 0.05 },
            { code: '1002', name: '银行存款', type: 'asset', source: 'cash_and_equivalents', ratio: 0.95 },
            { code: '1122', name: '应收账款', type: 'asset', source: 'accounts_receivable', ratio: 1.0 },
            { code: '1123', name: '预付账款', type: 'asset', source: 'prepayments', ratio: 1.0 },
            { code: '1405', name: '存货', type: 'asset', source: 'inventory', ratio: 1.0 },
            { code: '1601', name: '固定资产', type: 'asset', source: 'fixed_assets', ratio: 1.0 },
            { code: '1701', name: '无形资产', type: 'asset', source: 'intangible_assets', ratio: 1.0 },

            // 负债类
            { code: '2001', name: '短期借款', type: 'liability', source: 'short_term_loans', ratio: 1.0 },
            { code: '2201', name: '应付账款', type: 'liability', source: 'accounts_payable', ratio: 1.0 },
            { code: '2211', name: '应付职工薪酬', type: 'liability', source: 'employee_benefits_payable', ratio: 1.0 },
            { code: '2221', name: '应交税费', type: 'liability', source: 'taxes_payable', ratio: 1.0 },
            { code: '2501', name: '长期借款', type: 'liability', source: 'long_term_loans', ratio: 1.0 },

            // 权益类
            { code: '4001', name: '实收资本', type: 'equity', source: 'paid_in_capital', ratio: 1.0 },
            { code: '4002', name: '资本公积', type: 'equity', source: 'capital_surplus', ratio: 1.0 },
            { code: '4101', name: '盈余公积', type: 'equity', source: 'surplus_reserves', ratio: 1.0 },
            { code: '4103', name: '未分配利润', type: 'equity', source: 'retained_earnings', ratio: 1.0 }
        ];
    }

    /**
     * 计算科目余额
     */
    static calculateAccountBalance(account, balanceSheet) {
        const endingBalance = (balanceSheet[account.source] || 0) * account.ratio;

        // 期初余额 = 期末余额 * 0.95 (简化处理)
        const openingBalance = endingBalance * 0.95;

        // 借贷发生额
        let debitAmount = 0;
        let creditAmount = 0;

        if (account.type === 'asset') {
            // 资产类: 借方增加
            if (endingBalance > openingBalance) {
                debitAmount = endingBalance - openingBalance;
            } else {
                creditAmount = openingBalance - endingBalance;
            }
        } else {
            // 负债和权益类: 贷方增加
            if (endingBalance > openingBalance) {
                creditAmount = endingBalance - openingBalance;
            } else {
                debitAmount = openingBalance - endingBalance;
            }
        }

        // 添加一些交易波动
        const volatility = RandomHelper.withVolatility(1, 0.2);
        debitAmount = debitAmount * volatility;
        creditAmount = creditAmount * volatility;

        return {
            opening_balance: openingBalance,
            debit_amount: debitAmount,
            credit_amount: creditAmount,
            ending_balance: endingBalance
        };
    }

    /**
     * 批量生成多个期间的数据
     */
    static generateMultiple(companyProfile, periods, balanceSheets) {
        const allAccountBalances = [];

        periods.forEach(({ year, quarter }) => {
            const balanceSheet = balanceSheets.find(
                bs => bs.period_year === year && bs.period_quarter === quarter
            );

            if (balanceSheet) {
                const quarterlyBalances = this.generate(companyProfile, year, quarter, balanceSheet);
                allAccountBalances.push(...quarterlyBalances);
            }
        });

        return allAccountBalances;
    }
}

module.exports = AccountBalanceGenerator;
