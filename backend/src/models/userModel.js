const dbManager = require('../models/database');

/**
 * 用户模型
 */
class UserModel {
    constructor() {
        this.db = dbManager.getDatabase();
        this.initializeTable();
    }

    /**
     * 初始化用户表
     */
    initializeTable() {
        const tableExists = this.db.db.prepare(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='users'
        `).get();

        if (!tableExists) {
            this.db.db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    user_type TEXT DEFAULT 'enterprise',
                    full_name TEXT,
                    phone TEXT,
                    company_id INTEGER,
                    is_active INTEGER DEFAULT 1,
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (company_id) REFERENCES companies (id)
                )
            `);
            console.log('用户表创建成功');
        }
    }

    /**
     * 创建用户
     */
    create(userData) {
        const stmt = this.db.db.prepare(`
            INSERT INTO users (username, email, password, user_type, full_name, phone, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            userData.username,
            userData.email,
            userData.password,
            userData.userType || 'enterprise',
            userData.fullName || null,
            userData.phone || null,
            userData.companyId || null
        );

        return result.lastInsertRowid;
    }

    /**
     * 根据用户名查找用户
     */
    findByUsername(username) {
        const stmt = this.db.db.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username);
    }

    /**
     * 根据邮箱查找用户
     */
    findByEmail(email) {
        const stmt = this.db.db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }

    /**
     * 根据 ID 查找用户
     */
    findById(id) {
        const stmt = this.db.db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    }

    /**
     * 更新用户信息
     */
    update(id, userData) {
        const fields = [];
        const values = [];

        if (userData.fullName !== undefined) {
            fields.push('full_name = ?');
            values.push(userData.fullName);
        }
        if (userData.phone !== undefined) {
            fields.push('phone = ?');
            values.push(userData.phone);
        }
        if (userData.userType !== undefined) {
            fields.push('user_type = ?');
            values.push(userData.userType);
        }
        if (userData.companyId !== undefined) {
            fields.push('company_id = ?');
            values.push(userData.companyId);
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const stmt = this.db.db.prepare(`
            UPDATE users SET ${fields.join(', ')} WHERE id = ?
        `);

        const result = stmt.run(...values);
        return result.changes > 0;
    }

    /**
     * 更新最后登录时间
     */
    updateLastLogin(id) {
        const stmt = this.db.db.prepare(`
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
        `);
        stmt.run(id);
    }

    /**
     * 删除用户
     */
    delete(id) {
        const stmt = this.db.db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * 获取所有用户
     */
    findAll() {
        const stmt = this.db.db.prepare(`
            SELECT id, username, email, user_type, full_name, phone, 
                   company_id, is_active, last_login, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        return stmt.all();
    }
}

module.exports = new UserModel();
