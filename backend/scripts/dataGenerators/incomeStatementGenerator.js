/**
 * 利润表数据生成器
 */

const FinancialCalculator = require('../utils/financialCalculator');
const RandomHelper = require('../utils/randomHelper');

class IncomeStatementGenerator {
    /**
     * 生成指定期间的利润表数据
     */
    static generate(companyProfile, year, quarter) {
        const { id, baseline, growth, ratios } = companyProfile;

        // 计算年份偏移
        const yearsElapsed = year - 2022 + (quarter - 1) / 4;

        // 获取增长率（处理数组形式的增长率）
        let revenueGrowthRate = growth.yearlyRevenue;
        let profitGrowthRate = growth.yearlyProfit;

        if (Array.isArray(revenueGrowthRate)) {
            const yearIndex = year - 2022;
            revenueGrowthRate = revenueGrowthRate[yearIndex] || revenueGrowthRate[revenueGrowthRate.length - 1];
        }

        if (Array.isArray(profitGrowthRate)) {
            const yearIndex = year - 2022;
            profitGrowthRate = profitGrowthRate[yearIndex] || profitGrowthRate[profitGrowthRate.length - 1];
        }

        // 计算营业收入
        let revenue = FinancialCalculator.applyYearlyGrowth(
            baseline.revenue,
            revenueGrowthRate,
            yearsElapsed
        );

        // 应用季节性和随机波动
        revenue = FinancialCalculator.applySeasonality(revenue, quarter, growth.seasonality);
        revenue = RandomHelper.withVolatility(revenue, growth.volatility);

        // 调整毛利率和净利率（根据年份可能有变化）
        let grossMargin = ratios.grossMargin;
        let netMargin = ratios.netMargin;

        // 对于转型企业，2022年利润率更低，之后逐步改善
        if (companyProfile.type === '转型波动型') {
            if (year === 2022) {
                netMargin = -0.025;
                grossMargin = 0.15;
            } else if (year === 2023) {
                netMargin = 0.02;
                grossMargin = 0.17;
            } else {
                netMargin = 0.05;
                grossMargin = 0.19;
            }
        }

        // 使用财务计算器生成利润表
        const incomeData = FinancialCalculator.incomeStatement(
            revenue,
            grossMargin,
            netMargin,
            ratios.taxRate
        );

        // 期间描述
        const period = `${year}年第${quarter}季度`;
        const reportDate = `${year}-${String(quarter * 3).padStart(2, '0')}-${quarter === 1 ? '31' : quarter === 2 ? '30' : quarter === 3 ? '30' : '31'}`;

        return {
            company_id: id,
            period_year: year,
            period_month: quarter * 3,
            period_quarter: quarter,
            period: period,
            report_date: reportDate,

            ...incomeData
        };
    }

    /**
     * 批量生成多个期间的数据
     */
    static generateMultiple(companyProfile, periods) {
        return periods.map(({ year, quarter }) =>
            this.generate(companyProfile, year, quarter)
        );
    }
}

module.exports = IncomeStatementGenerator;
