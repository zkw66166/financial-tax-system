const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        const dbDir = path.join(__dirname, '../../database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.dbPath = path.join(dbDir, 'financial.db');
        this.db = new Database(this.dbPath);

        this.db.pragma('foreign_keys = ON');

        this.initializeTables();
    }

    initializeTables() {
        console.log('Starting database initialization...');

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                tax_code TEXT UNIQUE
            )
        `);

        console.log('Database initialization complete');
    }
}

module.exports = new DatabaseManager();
