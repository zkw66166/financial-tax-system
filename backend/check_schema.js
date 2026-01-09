const db = require('./src/models/database.js');

// Check balance_sheets schema
db.all("PRAGMA table_info(balance_sheets)", [], (err, columns) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('balance_sheets columns:');
        columns.forEach(col => console.log(`  ${col.name}: ${col.type}`));
    }

    // Check income_statements schema
    db.all("PRAGMA table_info(income_statements)", [], (err2, columns2) => {
        if (err2) {
            console.error('Error:', err2);
        } else {
            console.log('\nincome_statements columns:');
            columns2.forEach(col => console.log(`  ${col.name}: ${col.type}`));
        }
        db.close();
    });
});
