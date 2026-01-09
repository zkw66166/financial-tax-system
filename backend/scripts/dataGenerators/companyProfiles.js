/**
 * 企业基础配置文件
 * 定义4家示例企业的特征和基准数据
 */

const companyProfiles = {
    5: {
        id: 5,
        name: 'ABC有限公司',
        industry: '软件和信息技术服务业',
        industryCode: '3011',
        type: '高速成长型',

        // 基准数据 (2022年Q1)
        baseline: {
            totalAssets: 50000000,        // 5000万
            totalLiabilities: 18000000,   // 1800万 (资产负债率36%)
            totalEquity: 32000000,        // 3200万
            revenue: 8000000,             // 季度收入800万
            cost: 2800000,                // 营业成本280万 (毛利率65%)
            netProfit: 1200000,           // 净利润120万 (净利率15%)
            employees: 120,
            avgSalary: 15000
        },

        // 增长率配置
        growth: {
            yearlyRevenue: 0.30,          // 年收入增长30%
            yearlyAssets: 0.25,           // 年资产增长25%
            yearlyProfit: 0.35,           // 年利润增长35%
            seasonality: [0.9, 1.0, 1.05, 1.15], // Q1-Q4季节系数
            volatility: 0.05              // 随机波动±5%
        },

        // 财务比率目标
        ratios: {
            grossMargin: 0.65,            // 毛利率65%
            netMargin: 0.15,              // 净利率15%
            debtRatio: 0.36,              // 资产负债率36%
            currentRatio: 2.5,            // 流动比率2.5
            taxRate: 0.15                 // 所得税率15% (高新技术企业)
        }
    },

    8: {
        id: 8,
        name: '123制造厂',
        industry: '通用设备制造业',
        industryCode: '3511',
        type: '传统稳定型',

        baseline: {
            totalAssets: 80000000,        // 8000万 (重资产)
            totalLiabilities: 48000000,   // 4800万 (资产负债率60%)
            totalEquity: 32000000,        // 3200万
            revenue: 15000000,            // 季度收入1500万
            cost: 11500000,               // 营业成本1150万 (毛利率23%)
            netProfit: 600000,            // 净利润60万 (净利率4%)
            employees: 200,
            avgSalary: 8000
        },

        growth: {
            yearlyRevenue: 0.08,          // 年收入增长8%
            yearlyAssets: 0.06,           // 年资产增长6%
            yearlyProfit: 0.10,           // 年利润增长10%
            seasonality: [0.85, 0.95, 1.05, 1.15],
            volatility: 0.08
        },

        ratios: {
            grossMargin: 0.23,
            netMargin: 0.04,
            debtRatio: 0.60,
            currentRatio: 1.3,
            taxRate: 0.25
        }
    },

    10: {
        id: 10,
        name: '太空科技公司',
        industry: '软件和信息技术服务业',
        industryCode: '3011',
        type: '成熟稳定型',

        baseline: {
            totalAssets: 200000000,       // 2亿 (大型企业)
            totalLiabilities: 90000000,   // 9000万 (资产负债率45%)
            totalEquity: 110000000,       // 1.1亿
            revenue: 35000000,            // 季度收入3500万
            cost: 16000000,               // 营业成本1600万 (毛利率54%)
            netProfit: 4500000,           // 净利润450万 (净利率13%)
            employees: 500,
            avgSalary: 18000
        },

        growth: {
            yearlyRevenue: 0.18,          // 年收入增长18%
            yearlyAssets: 0.15,           // 年资产增长15%
            yearlyProfit: 0.20,           // 年利润增长20%
            seasonality: [0.92, 0.98, 1.02, 1.08],
            volatility: 0.04
        },

        ratios: {
            grossMargin: 0.54,
            netMargin: 0.13,
            debtRatio: 0.45,
            currentRatio: 2.0,
            taxRate: 0.15
        }
    },

    11: {
        id: 11,
        name: '环球机械有限公司',
        industry: '机械制造',
        industryCode: '3511',
        type: '转型波动型',

        baseline: {
            totalAssets: 120000000,       // 1.2亿
            totalLiabilities: 78000000,   // 7800万 (资产负债率65%)
            totalEquity: 42000000,        // 4200万
            revenue: 20000000,            // 季度收入2000万
            cost: 16500000,               // 营业成本1650万 (毛利率17.5%)
            netProfit: -500000,           // 净利润-50万 (2022年亏损)
            employees: 300,
            avgSalary: 7500
        },

        growth: {
            // 特殊增长模式: 2022年下滑，2023-2024恢复
            yearlyRevenue: [-0.05, 0.15, 0.20],  // 2022: -5%, 2023: +15%, 2024: +20%
            yearlyAssets: [0.02, 0.10, 0.12],
            yearlyProfit: [-2.0, 3.0, 0.50],     // 2022亏损加剧，2023扭亏，2024稳定
            seasonality: [0.80, 0.90, 1.10, 1.20],
            volatility: 0.10
        },

        ratios: {
            grossMargin: 0.175,
            netMargin: -0.025,            // 2022年负利润率
            debtRatio: 0.65,
            currentRatio: 1.1,
            taxRate: 0.25
        }
    }
};

module.exports = companyProfiles;
