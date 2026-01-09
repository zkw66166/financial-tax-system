const db = require('./src/models/database.js');

console.log('=== 当前企业信息 ===');
db.all('SELECT id, name, tax_code, industry, industry_code FROM companies', [], (err, rows) => {
    if (err) {
        console.error('查询企业失败:', err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }

    console.log('\n=== 检查各表数据量 ===');
    const tables = ['balance_sheets', 'income_statements', 'tax_reports', 'invoices', 'hr_salary_data', 'account_balances'];

    let completed = 0;
    tables.forEach(table => {
        db.all(`SELECT company_id, period_year, period_quarter, COUNT(*) as count FROM ${table} GROUP BY company_id, period_year, period_quarter ORDER BY company_id, period_year, period_quarter`, [], (err, data) => {
            if (err) {
                console.error(`查询${table}失败:`, err);
            } else {
                console.log(`\n${table}:`);
                console.log(JSON.stringify(data, null, 2));
            }

            completed++;
            if (completed === tables.length) {
                db.close();
            }
        });
    });
});
