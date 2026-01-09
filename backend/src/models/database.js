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

        // Activity logs table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
                user_id INTEGER,
                activity_type TEXT,
                description TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies (id)
            )
        `);

        console.log('Database initialization complete');
    }

    getDatabase() {
        return this;
    }

    // Wrapper methods for better-sqlite3
    all(sql, params = [], callback) {
        try {
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(...params);
            if (callback) callback(null, rows);
            return rows;
        } catch (error) {
            if (callback) callback(error, null);
            throw error;
        }
    }

    get(sql, params = [], callback) {
        try {
            const stmt = this.db.prepare(sql);
            const row = stmt.get(...params);
            if (callback) callback(null, row);
            return row;
        } catch (error) {
            if (callback) callback(error, null);
            throw error;
        }
    }

    run(sql, params = [], callback) {
        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...params);
            if (callback) callback(null, result);
            return result;
        } catch (error) {
            if (callback) callback(error, null);
            throw error;
        }
    }
}

module.exports = new DatabaseManager();
