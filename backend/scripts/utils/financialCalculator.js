/**
 * 财务计算工具
 * 确保财务数据符合会计逻辑
 */

class FinancialCalculator {
    /**
     * 计算年度增长后的值
     */
    static applyYearlyGrowth(baseValue, growthRate, yearsElapsed) {
        return baseValue * Math.pow(1 + growthRate, yearsElapsed);
    }

    /**
     * 应用季节性系数
     */
    static applySeasonality(value, quarter, seasonalityFactors) {
        return value * seasonalityFactors[quarter - 1];
    }

    /**
     * 计算资产负债表平衡
     * 确保: 总资产 = 总负债 + 总权益
     */
    static balanceSheet(totalAssets, debtRatio) {
        const totalLiabilities = totalAssets * debtRatio;
        const totalEquity = totalAssets - totalLiabilities;

        return {
            totalAssets: Math.round(totalAssets),
            totalLiabilities: Math.round(totalLiabilities),
            totalEquity: Math.round(totalEquity)
        };
    }

    /**
     * 分配流动资产和非流动资产
     */
    static allocateAssets(totalAssets, isLightAsset = false) {
        // 轻资产企业: 流动资产占比70-80%
        // 重资产企业: 流动资产占比40-50%
        const currentAssetRatio = isLightAsset ? 0.75 : 0.45;

        const currentAssetsTotal = totalAssets * currentAssetRatio;
        const nonCurrentAssetsTotal = totalAssets - currentAssetsTotal;

        // 流动资产细分
        const cashRatio = isLightAsset ? 0.40 : 0.20;
        const receivableRatio = isLightAsset ? 0.30 : 0.35;
        const inventoryRatio = isLightAsset ? 0.10 : 0.30;

        return {
            // 流动资产
            cash_and_equivalents: Math.round(currentAssetsTotal * cashRatio),
            trading_financial_assets: Math.round(currentAssetsTotal * 0.05),
            accounts_receivable: Math.round(currentAssetsTotal * receivableRatio),
            prepayments: Math.round(currentAssetsTotal * 0.05),
            other_receivables: Math.round(currentAssetsTotal * 0.05),
            inventory: Math.round(currentAssetsTotal * inventoryRatio),
            current_assets_total: Math.round(currentAssetsTotal),

            // 非流动资产
            long_term_equity_investment: Math.round(nonCurrentAssetsTotal * 0.10),
            fixed_assets: Math.round(nonCurrentAssetsTotal * 0.60),
            accumulated_depreciation: Math.round(nonCurrentAssetsTotal * 0.20),
            intangible_assets: Math.round(nonCurrentAssetsTotal * 0.20),
            accumulated_amortization: Math.round(nonCurrentAssetsTotal * 0.05),
            non_current_assets_total: Math.round(nonCurrentAssetsTotal)
        };
    }

    /**
     * 分配负债
     */
    static allocateLiabilities(totalLiabilities, currentRatio = 2.0) {
        // 根据流动比率反推流动负债
        // 假设流动资产已知，流动负债 = 流动资产 / 流动比率
        // 这里简化处理: 流动负债占总负债的60-70%
        const currentLiabilitiesRatio = 0.65;

        const currentLiabilitiesTotal = totalLiabilities * currentLiabilitiesRatio;
        const nonCurrentLiabilitiesTotal = totalLiabilities - currentLiabilitiesTotal;

        return {
            // 流动负债
            short_term_loans: Math.round(currentLiabilitiesTotal * 0.30),
            accounts_payable: Math.round(currentLiabilitiesTotal * 0.40),
            employee_benefits_payable: Math.round(currentLiabilitiesTotal * 0.10),
            taxes_payable: Math.round(currentLiabilitiesTotal * 0.10),
            current_liabilities_total: Math.round(currentLiabilitiesTotal),

            // 非流动负债
            long_term_loans: Math.round(nonCurrentLiabilitiesTotal * 0.80),
            non_current_liabilities_total: Math.round(nonCurrentLiabilitiesTotal)
        };
    }

    /**
     * 分配权益
     */
    static allocateEquity(totalEquity, retainedEarningsRatio = 0.40) {
        return {
            paid_in_capital: Math.round(totalEquity * 0.50),
            capital_surplus: Math.round(totalEquity * 0.10),
            surplus_reserves: Math.round(totalEquity * (1 - 0.50 - 0.10 - retainedEarningsRatio)),
            retained_earnings: Math.round(totalEquity * retainedEarningsRatio)
        };
    }

    /**
     * 计算利润表
     */
    static incomeStatement(revenue, grossMargin, netMargin, taxRate) {
        const operatingRevenue = Math.round(revenue);
        const operatingCosts = Math.round(revenue * (1 - grossMargin));
        const grossProfit = operatingRevenue - operatingCosts;

        // 期间费用 (销售、管理、财务费用)
        const sellingExpenses = Math.round(revenue * 0.10);
        const administrativeExpenses = Math.round(revenue * 0.08);
        const financialExpenses = Math.round(revenue * 0.02);
        const taxesAndSurcharges = Math.round(revenue * 0.01);

        const operatingProfit = grossProfit - sellingExpenses - administrativeExpenses - financialExpenses - taxesAndSurcharges;

        // 营业外收支
        const nonOperatingIncome = Math.round(revenue * 0.005);
        const nonOperatingExpenses = Math.round(revenue * 0.003);

        const totalProfit = operatingProfit + nonOperatingIncome - nonOperatingExpenses;

        // 所得税
        const incomeTaxExpense = totalProfit > 0 ? Math.round(totalProfit * taxRate) : 0;

        const netProfit = totalProfit - incomeTaxExpense;

        return {
            operating_revenue: operatingRevenue,
            operating_costs: operatingCosts,
            taxes_and_surcharges: taxesAndSurcharges,
            selling_expenses: sellingExpenses,
            administrative_expenses: administrativeExpenses,
            financial_expenses: financialExpenses,
            operating_profit: operatingProfit,
            non_operating_income: nonOperatingIncome,
            non_operating_expenses: nonOperatingExpenses,
            total_profit: totalProfit,
            income_tax_expense: incomeTaxExpense,
            net_profit: netProfit
        };
    }

    /**
     * 计算税务数据
     */
    static taxData(revenue, netProfit, taxRate) {
        // 增值税 (假设13%税率)
        const vatRate = 0.13;
        const vatPayable = Math.round(revenue * vatRate * 0.8); // 考虑进项抵扣

        // 企业所得税
        const incomeTaxPayable = netProfit > 0 ? Math.round(netProfit * taxRate) : 0;

        return {
            vat_payable: vatPayable,
            income_tax_payable: incomeTaxPayable,
            total_tax: vatPayable + incomeTaxPayable
        };
    }
}

module.exports = FinancialCalculator;
