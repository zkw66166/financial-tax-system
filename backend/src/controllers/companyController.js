const ProfileGenerator = require('../services/profileGenerator');
const dbManager = require('../models/database');

class CompanyController {
    constructor() {
        this.db = dbManager.getDatabase();
        this.profileGenerator = new ProfileGenerator(this.db);
    }

    // 获取企业列表
    getCompanies = (req, res) => {
        try {
            const companies = this.db.prepare(`
                SELECT id, name, tax_code, industry, company_scale, employee_count, created_at
                FROM companies 
                ORDER BY created_at DESC
            `).all();

            res.json({
                success: true,
                data: companies
            });
        } catch (error) {
            console.error('获取企业列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取企业列表失败'
            });
        }
    }

    // 获取企业详情
    getCompanyById = (req, res) => {
        try {
            const { id } = req.params;
            const company = this.db.prepare(`
                SELECT * FROM companies WHERE id = ?
            `).get(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
            }

            res.json({
                success: true,
                data: company
            });
        } catch (error) {
            console.error('获取企业详情失败:', error);
            res.status(500).json({
                success: false,
                message: '获取企业详情失败'
            });
        }
    }

    // 获取企业画像
    getCompanyProfile = async (req, res) => {
        try {
            const { id } = req.params;

            // 检查企业是否存在
            const company = this.db.prepare(`
                SELECT id FROM companies WHERE id = ?
            `).get(id);

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
            }

            const profile = await this.profileGenerator.generateProfile(id);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('获取企业画像失败:', error);
            res.status(500).json({
                success: false,
                message: '获取企业画像失败'
            });
        }
    }

    // 创建企业
    createCompany = (req, res) => {
        try {
            const companyData = req.body;

            const stmt = this.db.prepare(`
                INSERT INTO companies (
                    name, tax_code, company_type, legal_person, registered_capital,
                    establishment_date, business_term, address, business_scope,
                    industry, industry_code, company_scale, employee_count, shareholder_info
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                companyData.name,
                companyData.tax_code,
                companyData.company_type,
                companyData.legal_person,
                companyData.registered_capital,
                companyData.establishment_date,
                companyData.business_term,
                companyData.address,
                companyData.business_scope,
                companyData.industry,
                companyData.industry_code,
                companyData.company_scale,
                companyData.employee_count,
                companyData.shareholder_info
            );

            res.json({
                success: true,
                data: { id: result.lastInsertRowid },
                message: '企业创建成功'
            });
        } catch (error) {
            console.error('创建企业失败:', error);
            res.status(500).json({
                success: false,
                message: '创建企业失败'
            });
        }
    }

    // 删除企业
    deleteCompany = (req, res) => {
        try {
            const { id } = req.params;

            const stmt = this.db.prepare('DELETE FROM companies WHERE id = ?');
            const result = stmt.run(id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: '企业不存在'
                });
            }

            res.json({
                success: true,
                message: '企业删除成功'
            });
        } catch (error) {
            console.error('删除企业失败:', error);
            res.status(500).json({
                success: false,
                message: '删除企业失败'
            });
        }
    }
}

module.exports = new CompanyController();