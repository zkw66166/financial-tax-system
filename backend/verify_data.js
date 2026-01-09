/**
 * 数据验证脚本
 * 检查生成的示例数据质量
 */

const db = require('./src/models/database.js');

console.log('========================================');
console.log('数据验证报告');
console.log('========================================\n');

// 1. 检查数据覆盖范围
console.log('1. 数据覆盖范围检查');
console.log('-------------------');

db.all(`
    SELECT 
        c.id,
        c.name,
        c.industry,
        COUNT(DISTINCT bs.period_year || '-Q' || bs.period_quarter) as periods_count
    FROM companies c
    LEFT JOIN balance_sheets bs ON c.id = bs.company_id
    WHERE c.id IN (5, 8, 10, 11)
    GROUP BY c.id
`, [], (err, companies) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    companies.forEach(company => {
        console.log(`  ${company.name}: ${company.periods_count} 个期间`);
    });

    // 2. 检查期间分布
    console.log('\n2. 期间分布检查');
    console.log('-------------------');

    db.all(`
        SELECT 
            period_year,
            period_quarter,
            COUNT(DISTINCT company_id) as company_count
        FROM balance_sheets
        WHERE company_id IN (5, 8, 10, 11)
        GROUP BY period_year, period_quarter
        ORDER BY period_year, period_quarter
    `, [], (err2, periods) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }

        periods.forEach(p => {
            console.log(`  ${p.period_year}年Q${p.period_quarter}: ${p.company_count} 家企业`);
        });

        // 3. 检查财务逻辑
        console.log('\n3. 财务逻辑检查（资产负债表平衡）');
        console.log('-------------------');

        db.all(`
            SELECT 
                company_id,
                period_year,
                period_quarter,
                total_assets,
                total_liabilities,
                total_equity,
                (total_assets - total_liabilities - total_equity) as balance_diff
            FROM balance_sheets
            WHERE company_id IN (5, 8, 10, 11)
            AND ABS(total_assets - total_liabilities - total_equity) > 1
            ORDER BY company_id, period_year, period_quarter
        `, [], (err3, imbalances) => {
            if (err3) {
                console.error('Error:', err3);
                return;
            }

            if (imbalances.length === 0) {
                console.log('  ✓ 所有资产负债表均平衡');
            } else {
                console.log(`  ✗ 发现 ${imbalances.length} 条不平衡记录:`);
                imbalances.forEach(row => {
                    console.log(`    企业${row.company_id} ${row.period_year}Q${row.period_quarter}: 差额 ${row.balance_diff}`);
                });
            }

            // 4. 检查数据量
            console.log('\n4. 各表数据量统计');
            console.log('-------------------');

            const tables = ['balance_sheets', 'income_statements', 'tax_reports', 'invoices', 'hr_salary_data', 'account_balances'];
            let completed = 0;

            tables.forEach(table => {
                db.all(`
                    SELECT 
                        company_id,
                        COUNT(*) as count
                    FROM ${table}
                    WHERE company_id IN (5, 8, 10, 11)
                    GROUP BY company_id
                    ORDER BY company_id
                `, [], (err4, counts) => {
                    if (err4) {
                        console.error(`Error in ${table}:`, err4);
                    } else {
                        console.log(`\n  ${table}:`);
                        counts.forEach(row => {
                            console.log(`    企业 ${row.company_id}: ${row.count} 条`);
                        });
                    }

                    completed++;
                    if (completed === tables.length) {
                        // 5. 检查收入和利润趋势
                        console.log('\n5. 收入和利润趋势（2022-2024年度）');
                        console.log('-------------------');

                        db.all(`
                            SELECT 
                                company_id,
                                period_year,
                                SUM(operating_revenue) as yearly_revenue,
                                SUM(net_profit) as yearly_profit
                            FROM income_statements
                            WHERE company_id IN (5, 8, 10, 11)
                            AND period_year BETWEEN 2022 AND 2024
                            GROUP BY company_id, period_year
                            ORDER BY company_id, period_year
                        `, [], (err5, trends) => {
                            if (err5) {
                                console.error('Error:', err5);
                            } else {
                                let currentCompany = null;
                                trends.forEach(row => {
                                    if (row.company_id !== currentCompany) {
                                        console.log(`\n  企业 ${row.company_id}:`);
                                        currentCompany = row.company_id;
                                    }
                                    console.log(`    ${row.period_year}年: 收入 ${(row.yearly_revenue / 10000).toFixed(2)}万, 利润 ${(row.yearly_profit / 10000).toFixed(2)}万`);
                                });
                            }

                            console.log('\n========================================');
                            console.log('验证完成');
                            console.log('========================================\n');

                            db.close();
                        });
                    }
                });
            });
        });
    });
});
