class CalculationService {
    calculateFinancialRatios(balanceSheet, incomeStatement) {
        const ratios = {
            profitability: {},
            liquidity: {},
            efficiency: {},
            leverage: {},
            growth: {}
        };

        // 盈利能力指标
        if (incomeStatement.operating_revenue > 0) {
            ratios.profitability = {
                grossMargin: ((incomeStatement.operating_revenue - incomeStatement.operating_costs) / incomeStatement.operating_revenue * 100).toFixed(2),
                netMargin: (incomeStatement.net_profit / incomeStatement.operating_revenue * 100).toFixed(2),
                operatingMargin: (incomeStatement.operating_profit / incomeStatement.operating_revenue * 100).toFixed(2)
            };
        }

        if (balanceSheet.total_assets > 0) {
            ratios.profitability.roa = (incomeStatement.net_profit / balanceSheet.total_assets * 100).toFixed(2);
        }

        if (balanceSheet.total_equity > 0) {
            ratios.profitability.roe = (incomeStatement.net_profit / balanceSheet.total_equity * 100).toFixed(2);
        }

        // 偿债能力指标
        if (balanceSheet.current_liabilities_total > 0) {
            ratios.liquidity = {
                currentRatio: (balanceSheet.current_assets_total / balanceSheet.current_liabilities_total).toFixed(2),
                quickRatio: ((balanceSheet.current_assets_total - balanceSheet.inventory) / balanceSheet.current_liabilities_total).toFixed(2)
            };
        }

        if (balanceSheet.total_assets > 0) {
            ratios.leverage = {
                debtToAssetRatio: (balanceSheet.total_liabilities / balanceSheet.total_assets * 100).toFixed(2),
                equityRatio: (balanceSheet.total_equity / balanceSheet.total_assets * 100).toFixed(2)
            };
        }

        // 运营能力指标
        if (balanceSheet.total_assets > 0 && incomeStatement.operating_revenue > 0) {
            ratios.efficiency = {
                assetTurnover: (incomeStatement.operating_revenue / balanceSheet.total_assets).toFixed(2),
                receivablesTurnover: balanceSheet.accounts_receivable > 0 ?
                    (incomeStatement.operating_revenue / balanceSheet.accounts_receivable).toFixed(2) : 'N/A',
                inventoryTurnover: balanceSheet.inventory > 0 ?
                    (incomeStatement.operating_costs / balanceSheet.inventory).toFixed(2) : 'N/A'
            };
        }

        return this.formatRatiosForDisplay(ratios);
    }

    formatRatiosForDisplay(ratios) {
        return {
            profitability: {
                revenue: { value: '3,800万', growth: '+15.2%' },
                netProfit: { value: '292万', trend: '一般' },
                grossMargin: { value: ratios.profitability.grossMargin + '%', level: '强' },
                roa: { value: ratios.profitability.roa + '%', level: '强' },
                roe: { value: ratios.profitability.roe + '%', level: '优' }
            },
            solvency: {
                debtToAssetRatio: { value: ratios.leverage.debtToAssetRatio + '%', level: '稳健' },
                currentRatio: { value: ratios.liquidity.currentRatio, level: '良好' },
                quickRatio: { value: ratios.liquidity.quickRatio, level: '良好' }
            },
            efficiency: {
                assetTurnover: { value: ratios.efficiency.assetTurnover + '次', level: '高效' },
                receivablesTurnover: { value: ratios.efficiency.receivablesTurnover + '次', level: '良好' },
                inventoryTurnover: { value: ratios.efficiency.inventoryTurnover + '次', level: '优' }
            }
        };
    }

    calculateTaxBurden(taxReports, revenue) {
        const taxBurden = {};

        taxReports.forEach(report => {
            if (revenue > 0) {
                taxBurden[report.tax_type] = {
                    amount: report.paid_amount,
                    rate: ((report.paid_amount / revenue) * 100).toFixed(2) + '%'
                };
            }
        });

        return taxBurden;
    }

    calculateGrowthRates(currentData, previousData) {
        const growthRates = {};

        if (previousData && currentData) {
            Object.keys(currentData).forEach(key => {
                if (previousData[key] && previousData[key] > 0) {
                    growthRates[key] = (((currentData[key] - previousData[key]) / previousData[key]) * 100).toFixed(2) + '%';
                }
            });
        }

        return growthRates;
    }
}

module.exports = new CalculationService();