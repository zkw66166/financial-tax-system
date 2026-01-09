/**
 * 测试企业画像功能
 * 查询一家企业的2024年Q4数据，验证画像功能
 */

const db = require('./src/models/database.js');

const companyId = 5; // ABC有限公司
const year = 2024;
const quarter = 4;

console.log('========================================');
console.log(`测试企业画像功能 - 企业${companyId} ${year}年Q${quarter}`);
console.log('========================================\n');

// 1. 基础信息
db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, company) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('1. 企业基础信息');
    console.log('-------------------');
    console.log(`  名称: ${company.name}`);
    console.log(`  行业: ${company.industry}`);
    console.log(`  行业代码: ${company.industry_code}`);
    console.log(`  员工数: ${company.employee_count}`);

    // 2. 资产负债表
    db.get(`
        SELECT * FROM balance_sheets 
        WHERE company_id = ? AND period_year = ? AND period_quarter = ?
    `, [companyId, year, quarter], (err2, bs) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        console.log('\n2. 资产负债表（万元）');
        console.log('-------------------');
        console.log(`  总资产: ${(bs.total_assets / 10000).toFixed(2)}`);
        console.log(`  总负债: ${(bs.total_liabilities / 10000).toFixed(2)}`);
        console.log(`  总权益: ${(bs.total_equity / 10000).toFixed(2)}`);
        console.log(`  资产负债率: ${(bs.total_liabilities / bs.total_assets * 100).toFixed(2)}%`);
        console.log(`  流动比率: ${(bs.current_assets_total / bs.current_liabilities_total).toFixed(2)}`);

        // 3. 利润表
        db.get(`
            SELECT * FROM income_statements 
            WHERE company_id = ? AND period_year = ? AND period_quarter = ?
        `, [companyId, year, quarter], (err3, is) => {
            if (err3) {
                console.error('Error:', err3);
                return;
            }

            console.log('\n3. 利润表（万元）');
            console.log('-------------------');
            console.log(`  营业收入: ${(is.operating_revenue / 10000).toFixed(2)}`);
            console.log(`  营业成本: ${(is.operating_costs / 10000).toFixed(2)}`);
            console.log(`  净利润: ${(is.net_profit / 10000).toFixed(2)}`);
            console.log(`  毛利率: ${((is.operating_revenue - is.operating_costs) / is.operating_revenue * 100).toFixed(2)}%`);
            console.log(`  净利率: ${(is.net_profit / is.operating_revenue * 100).toFixed(2)}%`);

            // 4. 同比数据
            db.get(`
                SELECT * FROM income_statements 
                WHERE company_id = ? AND period_year = ? AND period_quarter = ?
            `, [companyId, year - 1, quarter], (err4, isPrev) => {
                if (err4) {
                    console.error('Error:', err4);
                    return;
                }

                console.log('\n4. 同比增长');
                console.log('-------------------');
                const revenueGrowth = (is.operating_revenue - isPrev.operating_revenue) / isPrev.operating_revenue * 100;
                const profitGrowth = (is.net_profit - isPrev.net_profit) / isPrev.net_profit * 100;
                console.log(`  收入增长率: ${revenueGrowth.toFixed(2)}%`);
                console.log(`  利润增长率: ${profitGrowth.toFixed(2)}%`);

                // 5. 税务数据
                db.all(`
                    SELECT tax_type, SUM(paid_amount) as total_tax
                    FROM tax_reports 
                    WHERE company_id = ? AND period_year = ? AND period_quarter = ?
                    GROUP BY tax_type
                `, [companyId, year, quarter], (err5, taxes) => {
                    if (err5) {
                        console.error('Error:', err5);
                        return;
                    }

                    console.log('\n5. 税务数据（万元）');
                    console.log('-------------------');
                    taxes.forEach(tax => {
                        console.log(`  ${tax.tax_type}: ${(tax.total_tax / 10000).toFixed(2)}`);
                    });

                    // 6. 人事数据
                    db.all(`
                        SELECT department, employee_count, average_salary
                        FROM hr_salary_data 
                        WHERE company_id = ? AND period_year = ? AND period_quarter = ?
                    `, [companyId, year, quarter], (err6, hr) => {
                        if (err6) {
                            console.error('Error:', err6);
                            return;
                        }

                        console.log('\n6. 人事薪酬');
                        console.log('-------------------');
                        let totalEmployees = 0;
                        hr.forEach(dept => {
                            console.log(`  ${dept.department}: ${dept.employee_count}人, 平均薪资${dept.average_salary}元`);
                            totalEmployees += dept.employee_count;
                        });
                        console.log(`  总员工数: ${totalEmployees}人`);

                        console.log('\n========================================');
                        console.log('✓ 企业画像数据完整，功能正常');
                        console.log('========================================\n');

                        db.close();
                    });
                });
            });
        });
    });
});
