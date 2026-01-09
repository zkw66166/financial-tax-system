/**
 * 资产负债表数据生成器
 */

const FinancialCalculator = require('../utils/financialCalculator');
const RandomHelper = require('../utils/randomHelper');

class BalanceSheetGenerator {
    /**
     * 生成指定期间的资产负债表数据
     */
    static generate(companyProfile, year, quarter) {
        const { id, baseline, growth, ratios } = companyProfile;

        // 计算年份偏移
        const yearsElapsed = year - 2022 + (quarter - 1) / 4;

        // 获取增长率（处理数组形式的增长率）
        let assetGrowthRate = growth.yearlyAssets;
        if (Array.isArray(assetGrowthRate)) {
            const yearIndex = year - 2022;
            assetGrowthRate = assetGrowthRate[yearIndex] || assetGrowthRate[assetGrowthRate.length - 1];
        }

        // 计算总资产
        let totalAssets = FinancialCalculator.applyYearlyGrowth(
            baseline.totalAssets,
            assetGrowthRate,
            yearsElapsed
        );

        // 应用季节性和随机波动
        totalAssets = FinancialCalculator.applySeasonality(totalAssets, quarter, growth.seasonality);
        totalAssets = RandomHelper.withVolatility(totalAssets, growth.volatility);

        // 计算负债和权益
        const balance = FinancialCalculator.balanceSheet(totalAssets, ratios.debtRatio);

        // 判断是否轻资产企业
        const isLightAsset = companyProfile.industryCode === '3011';

        // 分配资产
        const assets = FinancialCalculator.allocateAssets(balance.totalAssets, isLightAsset);

        // 分配负债
        const liabilities = FinancialCalculator.allocateLiabilities(balance.totalLiabilities, ratios.currentRatio);

        // 分配权益
        const equity = FinancialCalculator.allocateEquity(balance.totalEquity);

        // 计算期末日期
        const periodEndDate = `${year}-${String(quarter * 3).padStart(2, '0')}-${quarter === 1 ? '31' : quarter === 2 ? '30' : quarter === 3 ? '30' : '31'}`;

        return {
            company_id: id,
            period_year: year,
            period_month: quarter * 3,
            period_quarter: quarter,
            period_end_date: periodEndDate,

            // 资产
            ...assets,
            total_assets: balance.totalAssets,

            // 负债
            ...liabilities,
            total_liabilities: balance.totalLiabilities,

            // 权益
            ...equity,
            total_equity: balance.totalEquity
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

module.exports = BalanceSheetGenerator;
