# 🚀 快速开始指南

本指南将帮助您快速启动和测试新添加的功能。

---

## 📦 步骤 1: 安装依赖

### 方法 1: 从根目录安装所有依赖（推荐）

```bash
# 在项目根目录
npm run install:all
```

这将自动安装根目录、backend 和 frontend 的所有依赖。

### 方法 2: 分别安装

```bash
# 安装根目录依赖（用于并发运行前后端）
npm install

# 进入后端目录
cd backend

# 安装后端依赖
npm install

# 进入前端目录
cd ../frontend

# 安装前端依赖
npm install
```

**新安装的依赖包括**：

- better-sqlite3（数据库）
- xlsx（Excel 处理）
- dotenv（环境变量）
- winston（日志系统）
- joi（数据验证）
- bcrypt（密码加密）
- jsonwebtoken（JWT 认证）
- helmet（安全中间件）
- express-rate-limit（限流）
- jest & supertest（测试）
- concurrently（并发运行，根目录）

---

## ⚙️ 步骤 2: 配置环境变量

```bash
# 在 backend 目录下创建 .env 文件
# 可以复制模板文件
cp .env.example .env
```

**编辑 `.env` 文件**，至少设置以下内容：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 安全配置（重要！请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-session-secret-change-this

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=info
```

---

## 🧪 步骤 3: 运行测试

```bash
# 在 backend 目录下运行测试
npm test
```

**预期输出**：

```text
PASS  src/__tests__/app.test.js
  健康检查 API
    ✓ GET /api/health 应该返回 200 和正常状态
  404 错误处理
    ✓ 访问不存在的路由应该返回 404

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

---

## 🏃 步骤 4: 启动服务器

### 方法 1: 从根目录启动（推荐）

```bash
# 同时启动前端和后端（开发模式）
npm run dev

# 或分别启动
npm run dev:backend  # 只启动后端
npm run dev:frontend # 只启动前端
```

### 方法 2: 从 backend 目录启动

```bash
# 进入后端目录
cd backend

# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

**预期输出**：

```
2025-12-29 09:00:00 [info]: 服务器运行在端口 3001
2025-12-29 09:00:00 [info]: API地址: http://localhost:3001/api/health
2025-12-29 09:00:00 [info]: 环境: development
```

---

## 🔍 步骤 5: 测试 API

### 5.1 测试健康检查

```bash
curl http://localhost:3001/api/health
```

**预期响应**：

```json
{
  "status": "OK",
  "message": "服务器运行正常",
  "timestamp": "2025-12-27T13:30:00.000Z",
  "environment": "development"
}
```

### 5.2 测试用户注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "userType": "enterprise",
    "fullName": "测试用户"
  }'
```

**预期响应**：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "userType": "enterprise",
      "fullName": "测试用户"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5.3 测试用户登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**预期响应**：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "userType": "enterprise",
      "fullName": "测试用户"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5.4 测试获取用户信息（需要 token）

```bash
# 将 <YOUR_TOKEN> 替换为登录返回的 token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**预期响应**：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "userType": "enterprise",
    "fullName": "测试用户",
    "phone": null,
    "companyId": null,
    "lastLogin": "2025-12-27 21:30:00",
    "createdAt": "2025-12-27 21:25:00"
  }
}
```

### 5.5 测试数据验证（错误情况）

```bash
# 测试无效的邮箱格式
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "invalid-email",
    "password": "123"
  }'
```

**预期响应**：

```json
{
  "success": false,
  "status": "fail",
  "message": "数据验证失败: \"email\" must be a valid email, \"password\" length must be at least 6 characters long"
}
```

---

## 📊 步骤 6: 查看日志

日志文件会自动创建在 `backend/logs/` 目录下：

```bash
# 查看所有日志
cat backend/logs/combined.log

# 查看错误日志
cat backend/logs/error.log

# 实时监控日志
tail -f backend/logs/combined.log
```

**日志示例**：

```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "status": 200,
  "duration": "45ms",
  "timestamp": "2025-12-27 21:30:00",
  "service": "financial-tax-backend"
}
```

---

## 🎯 步骤 7: 测试限流功能

限流设置为 15 分钟内最多 100 次请求。

```bash
# 快速发送多个请求测试限流
for i in {1..105}; do
  curl http://localhost:3001/api/health
  echo "Request $i"
done
```

**预期**：前 100 次请求成功，第 101 次开始返回：

```json
{
  "message": "请求过于频繁，请稍后再试"
}
```

---

## 🔐 步骤 8: 测试安全功能

### 8.1 测试未授权访问

```bash
# 不带 token 访问需要认证的接口
curl -X GET http://localhost:3001/api/auth/me
```

**预期响应**：

```json
{
  "success": false,
  "status": "fail",
  "message": "请先登录"
}
```

### 8.2 测试无效 token

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid-token-here"
```

**预期响应**：

```json
{
  "success": false,
  "status": "fail",
  "message": "无效的认证令牌"
}
```

---

## 📱 步骤 9: 前端集成（可选）

如果要在前端集成认证功能，更新前端代码：

```javascript
// frontend/src/services/api.js

// 添加认证相关方法
async register(userData) {
    return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

async login(credentials) {
    return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

async getCurrentUser(token) {
    return this.request('/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
}
```

---

## ✅ 验证清单

完成以下检查确保一切正常：

- [ ] 依赖安装成功（无错误）
- [ ] 环境变量已配置
- [ ] 测试全部通过
- [ ] 服务器成功启动
- [ ] 健康检查 API 正常
- [ ] 用户注册成功
- [ ] 用户登录成功
- [ ] Token 认证正常
- [ ] 数据验证正常工作
- [ ] 日志文件正常生成
- [ ] 限流功能正常
- [ ] 错误处理正常

---

## 🐛 常见问题

### 问题 1: 依赖安装失败

**解决方案**：

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 2: better-sqlite3 编译错误

**解决方案**：

```bash
# Windows 用户需要安装构建工具
npm install --global windows-build-tools

# 或使用预编译版本
npm install better-sqlite3 --build-from-source
```

### 问题 3: 端口被占用

**解决方案**：

```bash
# 修改 .env 文件中的 PORT
PORT=3002

# 或在命令行指定
PORT=3002 npm run dev
```

### 问题 4: 测试失败 - 端口被占用 (EADDRINUSE)

**症状**：运行 `npm test` 时出现错误：

```
listen EADDRINUSE: address already in use :::3001
```

**原因**：服务器已经在运行，测试无法启动新的服务器实例。

**解决方案**：

```bash
# 方法 1: 停止正在运行的服务器
# 在 Windows 上查找并停止 Node 进程
netstat -ano | findstr :3001
# 记下 PID，然后停止进程
taskkill /PID <PID> /F

# 方法 2: 项目已经修复此问题
# app.js 现在只导出 Express 应用，不启动服务器
# server.js 负责启动服务器
# 测试会直接使用 app.js，不会启动服务器
```

**注意**：此问题已在最新版本中修复。`app.js` 和 `server.js` 已分离，测试不再会启动实际的服务器。

### 问题 5: JWT_SECRET 未设置警告

**解决方案**：
在 `.env` 文件中设置：

```env
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
```

---

## 📚 下一步

1. **前端集成**：更新前端代码以使用新的认证 API
2. **添加更多测试**：为认证功能添加完整的测试用例
3. **完善用户管理**：添加用户列表、权限管理等功能
4. **数据迁移**：如果有现有数据，需要迁移到新的用户系统

---

## 🆘 获取帮助

- 查看 `OPTIMIZATION_REPORT.md` 了解详细的优化内容
- 查看 `README.md` 了解项目整体信息
- 查看日志文件 `backend/logs/` 排查问题
- 查看测试文件 `backend/src/__tests__/` 了解测试示例

---

**祝您使用愉快！** 🎉
