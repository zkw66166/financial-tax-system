const db = require('./src/models/database.js');

const tables = db.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();

console.log('\n=== Database Tables ===');
tables.forEach(t => console.log('  ✓', t.name));

console.log('\n=== Companies Table Structure ===');
const companiesInfo = db.db.pragma('table_info(companies)');
companiesInfo.forEach(col => console.log(`  ${col.name}: ${col.type}`));

console.log('\n=== All Tables Created Successfully ===\n');
process.exit(0);
