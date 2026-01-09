/**
 * 税务申报数据生成器
 */

const FinancialCalculator = require('../utils/financialCalculator');
const RandomHelper = require('../utils/randomHelper');

class TaxReportGenerator {
    /**
     * 生成指定月份的税务申报数据
     */
    static generate(companyProfile, year, month, monthlyRevenue) {
        const { id, ratios } = companyProfile;

        const quarter = Math.ceil(month / 3);

        // 税务数据
        const taxData = FinancialCalculator.taxData(monthlyRevenue, monthlyRevenue * ratios.netMargin, ratios.taxRate);

        // 生成不同类型的税务申报
        const taxTypes = [
            {
                tax_type: '增值税',
                taxable_amount: Math.round(monthlyRevenue),
                paid_amount: taxData.vat_payable,
                tax_rate: 0.13
            },
            {
                tax_type: '企业所得税',
                taxable_amount: Math.round(monthlyRevenue * ratios.netMargin),
                paid_amount: taxData.income_tax_payable,
                tax_rate: ratios.taxRate
            }
        ];

        const period = `${year}-${String(month).padStart(2, '0')}-01`;
        const reportDate = `${year}-${String(month).padStart(2, '0')}-15`;

        return taxTypes.map(taxType => ({
            company_id: id,
            period_year: year,
            period_month: month,
            period_quarter: quarter,
            tax_type: taxType.tax_type,
            period: period,
            report_date: reportDate,
            taxable_amount: taxType.taxable_amount,
            paid_amount: taxType.paid_amount,
            refund_amount: 0,
            tax_rate: taxType.tax_rate,
            vat_payable: taxType.tax_type === '增值税' ? taxType.paid_amount : 0,
            income_tax_payable: taxType.tax_type === '企业所得税' ? taxType.paid_amount : 0
        }));
    }

    /**
     * 批量生成多个期间的数据
     * @param {Object} companyProfile - 企业配置
     * @param {Array} periods - 期间数组 [{year, quarter}]
     * @param {Array} incomeStatements - 利润表数据（用于获取收入）
     */
    static generateMultiple(companyProfile, periods, incomeStatements) {
        const allTaxReports = [];

        // 为每个季度生成3个月的税务申报
        periods.forEach(({ year, quarter }) => {
            // 找到对应季度的利润表
            const incomeStatement = incomeStatements.find(
                is => is.period_year === year && is.period_quarter === quarter
            );

            if (!incomeStatement) return;

            // 季度收入平均分配到3个月
            const monthlyRevenue = incomeStatement.operating_revenue / 3;

            // 生成该季度3个月的税务申报
            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                const month = (quarter - 1) * 3 + monthOffset + 1;

                // 添加月度波动
                const adjustedRevenue = RandomHelper.withVolatility(monthlyRevenue, 0.15);

                const monthlyTaxReports = this.generate(companyProfile, year, month, adjustedRevenue);
                allTaxReports.push(...monthlyTaxReports);
            }
        });

        return allTaxReports;
    }
}

module.exports = TaxReportGenerator;
