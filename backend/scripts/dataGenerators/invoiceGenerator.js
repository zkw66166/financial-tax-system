/**
 * 发票数据生成器
 */

const RandomHelper = require('../utils/randomHelper');

class InvoiceGenerator {
    /**
     * 生成指定月份的发票数据
     */
    static generate(companyProfile, year, month, monthlyRevenue, count = 10) {
        const { id, name } = companyProfile;
        const quarter = Math.ceil(month / 3);

        const invoices = [];

        // 生成销项发票（公司作为卖方）
        const outputCount = Math.ceil(count * 0.6);
        const outputAmount = monthlyRevenue * 0.7; // 70%通过发票

        for (let i = 0; i < outputCount; i++) {
            const amount = RandomHelper.withVolatility(outputAmount / outputCount, 0.3);
            const taxAmount = amount * 0.13; // 13%增值税

            invoices.push({
                company_id: id,
                period_year: year,
                period_month: month,
                period_quarter: quarter,
                invoice_number: `${year}${String(month).padStart(2, '0')}${String(i + 1).padStart(6, '0')}`,
                invoice_type: '增值税专用发票-销项',
                amount: Math.round(amount),
                tax_amount: Math.round(taxAmount),
                issue_date: RandomHelper.randomDate(year, month),
                buyer_name: this.generateCustomerName(i),
                seller_name: name
            });
        }

        // 生成进项发票（公司作为买方）
        const inputCount = count - outputCount;
        const inputAmount = monthlyRevenue * 0.5; // 进项金额

        for (let i = 0; i < inputCount; i++) {
            const amount = RandomHelper.withVolatility(inputAmount / inputCount, 0.3);
            const taxAmount = amount * 0.13;

            invoices.push({
                company_id: id,
                period_year: year,
                period_month: month,
                period_quarter: quarter,
                invoice_number: `IN${year}${String(month).padStart(2, '0')}${String(i + 1).padStart(6, '0')}`,
                invoice_type: '增值税专用发票-进项',
                amount: Math.round(amount),
                tax_amount: Math.round(taxAmount),
                issue_date: RandomHelper.randomDate(year, month),
                buyer_name: name,
                seller_name: this.generateSupplierName(i)
            });
        }

        return invoices;
    }

    /**
     * 生成客户名称
     */
    static generateCustomerName(index) {
        const customers = [
            '北京科技有限公司',
            '上海贸易公司',
            '深圳电子科技',
            '广州商贸有限公司',
            '杭州网络科技',
            '成都信息技术',
            '武汉制造企业',
            '南京软件公司',
            '西安工业集团',
            '重庆商业公司'
        ];
        return customers[index % customers.length];
    }

    /**
     * 生成供应商名称
     */
    static generateSupplierName(index) {
        const suppliers = [
            '原材料供应商A',
            '设备供应商B',
            '服务提供商C',
            '物流公司D',
            '软件服务商E',
            '咨询公司F',
            '广告公司G',
            '物业管理公司H'
        ];
        return suppliers[index % suppliers.length];
    }

    /**
     * 批量生成多个期间的数据
     */
    static generateMultiple(companyProfile, periods, incomeStatements) {
        const allInvoices = [];

        periods.forEach(({ year, quarter }) => {
            const incomeStatement = incomeStatements.find(
                is => is.period_year === year && is.period_quarter === quarter
            );

            if (!incomeStatement) return;

            const monthlyRevenue = incomeStatement.operating_revenue / 3;

            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                const month = (quarter - 1) * 3 + monthOffset + 1;
                const adjustedRevenue = RandomHelper.withVolatility(monthlyRevenue, 0.15);

                const monthlyInvoices = this.generate(companyProfile, year, month, adjustedRevenue, 10);
                allInvoices.push(...monthlyInvoices);
            }
        });

        return allInvoices;
    }
}

module.exports = InvoiceGenerator;
