const calculationService = require('./calculationService');

class ProfileGenerator {
    constructor(db) {
        this.db = db;
    }

    async generateProfile(companyId) {
        try {
            const profile = {
                basicInfo: await this.getBasicInfo(companyId),
                industryCharacteristics: await this.getIndustryCharacteristics(companyId),
                financialIndicators: await this.getFinancialIndicators(companyId),
                hrAndSalary: await this.getHRAndSalaryData(companyId),
                supplyChainOperations: await this.getSupplyChainOperations(companyId),
                taxReporting: await this.getTaxReporting(companyId),
                invoiceTransactions: await this.getInvoiceTransactions(companyId),
                taxCompliance: await this.getTaxCompliance(companyId),
                organizationalStructure: await this.getOrganizationalStructure(companyId),
                taxBurdenAnalysis: await this.getTaxBurdenAnalysis(companyId)
            };

            return profile;
        } catch (error) {
            console.error('生成企业画像失败:', error);
            throw error;
        }
    }

    async getBasicInfo(companyId) {
        const company = this.db.prepare(`
            SELECT * FROM companies WHERE id = ?
        `).get(companyId);

        if (!company) return null;

        // 解析股东信息
        const shareholders = this.parseShareholderInfo(company.shareholder_info);

        return {
            name: company.name,
            taxCode: company.tax_code,
            companyType: company.company_type,
            legalPerson: company.legal_person,
            registeredCapital: company.registered_capital,
            establishmentDate: company.establishment_date,
            address: company.address,
            businessScope: company.business_scope,
            industry: company.industry,
            industryCode: company.industry_code,
            companyScale: company.company_scale,
            employeeCount: company.employee_count,
            shareholders: shareholders
        };
    }

    async getIndustryCharacteristics(companyId) {
        const company = this.db.prepare(`
            SELECT industry, industry_code, company_scale FROM companies WHERE id = ?
        `).get(companyId);

        if (!company) return null;

        return {
            classification: company.industry_code + ' - ' + company.industry,
            characteristics: this.getIndustryCharacteristics(company.industry),
            marketPosition: {
                ranking: '区域前20',
                marketShare: '8.2%'
            }
        };
    }

    async getFinancialIndicators(companyId) {
        const balanceSheet = this.db.prepare(`
            SELECT * FROM balance_sheets WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(companyId);

        const incomeStatement = this.db.prepare(`
            SELECT * FROM income_statements WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(companyId);

        if (!balanceSheet || !incomeStatement) return null;

        return calculationService.calculateFinancialRatios(balanceSheet, incomeStatement);
    }

    async getHRAndSalaryData(companyId) {
        const hrData = this.db.prepare(`
            SELECT * FROM hr_salary_data WHERE company_id = ?
        `).all(companyId);

        if (!hrData.length) return null;

        const totalEmployees = hrData.reduce((sum, dept) => sum + dept.employee_count, 0);
        const totalSalary = hrData.reduce((sum, dept) => sum + (dept.average_salary * dept.employee_count), 0);
        const avgSalary = totalSalary / totalEmployees;

        return {
            employeeStructure: hrData.map(dept => ({
                department: dept.department,
                count: dept.employee_count,
                ratio: ((dept.employee_count / totalEmployees) * 100).toFixed(1) + '%',
                avgSalary: dept.average_salary
            })),
            compensationStructure: {
                totalEmployees: totalEmployees,
                averageSalary: Math.round(avgSalary),
                socialInsuranceCoverage: '100%',
                housingFundCoverage: '98.7%'
            }
        };
    }

    async getSupplyChainOperations(companyId) {
        // 基于账户余额表分析供应链情况
        const accounts = this.db.prepare(`
            SELECT * FROM account_balances WHERE company_id = ?
        `).all(companyId);

        const receivables = accounts.find(acc => acc.account_name.includes('应收账款'))?.ending_balance || 0;
        const payables = accounts.find(acc => acc.account_name.includes('应付账款'))?.ending_balance || 0;
        const inventory = accounts.find(acc => acc.account_name.includes('存货'))?.ending_balance || 0;

        return {
            supplierManagement: {
                accountsPayable: payables,
                paymentTerms: '平均45天'
            },
            customerManagement: {
                accountsReceivable: receivables,
                collectionPeriod: '平均38天'
            },
            inventoryManagement: {
                inventoryLevel: inventory,
                turnoverDays: '38天'
            }
        };
    }

    async getTaxReporting(companyId) {
        const taxReports = this.db.prepare(`
            SELECT * FROM tax_reports WHERE company_id = ?
        `).all(companyId);

        if (!taxReports.length) return null;

        const vatReport = taxReports.find(r => r.tax_type === '增值税');
        const citReport = taxReports.find(r => r.tax_type === '企业所得税');

        return {
            corporateIncomeTax: citReport ? {
                taxableIncome: citReport.taxable_amount,
                taxRate: citReport.tax_rate,
                taxAmount: citReport.paid_amount
            } : null,
            valueAddedTax: vatReport ? {
                taxableAmount: vatReport.taxable_amount,
                taxRate: vatReport.tax_rate,
                taxAmount: vatReport.paid_amount
            } : null
        };
    }

    async getInvoiceTransactions(companyId) {
        const invoices = this.db.prepare(`
            SELECT * FROM invoice_data WHERE company_id = ?
        `).all(companyId);

        if (!invoices.length) return null;

        const specialVAT = invoices.find(inv => inv.invoice_type === '增值税专用发票');
        const normalVAT = invoices.find(inv => inv.invoice_type === '增值税普通发票');

        return {
            issuance: {
                specialVATAmount: specialVAT?.invoice_amount || 0,
                normalVATAmount: normalVAT?.invoice_amount || 0,
                totalCount: invoices.reduce((sum, inv) => sum + inv.invoice_count, 0)
            },
            businessTaxStructure: {
                mainTaxRate: '6%',
                taxableAmount: invoices.reduce((sum, inv) => sum + inv.invoice_amount, 0)
            }
        };
    }

    async getTaxCompliance(companyId) {
        const taxReports = this.db.prepare(`
            SELECT * FROM tax_reports WHERE company_id = ?
        `).all(companyId);

        const totalTax = taxReports.reduce((sum, report) => sum + report.paid_amount, 0);
        const incomeStatement = this.db.prepare(`
            SELECT operating_revenue FROM income_statements WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(companyId);

        const revenue = incomeStatement?.operating_revenue || 0;
        const taxBurdenRate = revenue > 0 ? ((totalTax / revenue) * 100).toFixed(2) : '0.00';

        return {
            taxFilingStatus: '按时申报',
            taxBurdenRate: taxBurdenRate + '%',
            complianceRating: 'A级',
            invoiceManagement: {
                complianceRate: '99.8%',
                electronicInvoiceRate: '92.3%'
            }
        };
    }

    async getOrganizationalStructure(companyId) {
        const company = await this.getBasicInfo(companyId);
        const hrData = await this.getHRAndSalaryData(companyId);

        return {
            equityStructure: company?.shareholders || [],
            personnelStructure: hrData?.employeeStructure || []
        };
    }

    async getTaxBurdenAnalysis(companyId) {
        const taxReports = this.db.prepare(`
            SELECT * FROM tax_reports WHERE company_id = ?
        `).all(companyId);

        const incomeStatement = this.db.prepare(`
            SELECT operating_revenue FROM income_statements WHERE company_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(companyId);

        if (!incomeStatement || !taxReports.length) return null;

        const revenue = incomeStatement.operating_revenue;
        const taxBurdenRates = {};

        taxReports.forEach(report => {
            if (revenue > 0) {
                taxBurdenRates[report.tax_type] = ((report.paid_amount / revenue) * 100).toFixed(2) + '%';
            }
        });

        return {
            actualTaxBurden: taxBurdenRates,
            industryComparison: {
                '增值税': '行业平均: 10.8%',
                '企业所得税': '行业平均: 15.2%'
            },
            optimizationSpace: this.calculateOptimizationSpace(taxBurdenRates)
        };
    }

    parseShareholderInfo(shareholderInfo) {
        if (!shareholderInfo) return [];

        try {
            return shareholderInfo.split(';').map(item => {
                const [name, ratio] = item.split('(');
                return {
                    name: name.trim(),
                    ratio: ratio ? ratio.replace(')', '') : '0%'
                };
            });
        } catch (error) {
            return [];
        }
    }

    getIndustryCharacteristics(industry) {
        const characteristicsMap = {
            '软件和信息技术服务业': ['技术密集型', '人才密集型', '轻资产'],
            '制造业': ['资本密集型', '技术密集型', '重资产'],
            '批发和零售业': ['贸易型', '资金密集型', '轻资产'],
            '建筑业': ['劳动密集型', '资金密集型', '重资产']
        };

        return characteristicsMap[industry] || ['待分析'];
    }

    calculateOptimizationSpace(taxBurdenRates) {
        const optimizations = [];

        Object.entries(taxBurdenRates).forEach(([taxType, rate]) => {
            const numericRate = parseFloat(rate);
            if (taxType === '增值税' && numericRate > 3) {
                optimizations.push('增值税可优化至3%以下');
            }
            if (taxType === '企业所得税' && numericRate > 15) {
                optimizations.push('可申请高新技术企业认定');
            }
        });

        return optimizations;
    }
}

module.exports = ProfileGenerator;