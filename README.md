# 财税管理系统 (Financial Tax System)

一个企业财税数据管理和分析系统，支持企业信息管理、财务报表导入、税务申报数据处理和企业画像生成。

## 📋 项目简介

本系统为企业和会计师事务所提供一站式财税数据管理解决方案，包括：

- 📊 **企业信息管理** - 企业基本信息维护
- 💰 **财务数据导入** - 支持资产负债表、利润表等财务报表批量导入
- 📈 **税务数据管理** - 税务申报数据录入和查询
- 🎯 **企业画像生成** - 基于财务数据自动生成企业经营画像
- 📁 **数据模板** - 提供标准化的 Excel 数据导入模板

## 🏗️ 技术栈

### 前端
- **React** 18.2.0 - UI 框架
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端
- **Node.js** - 运行环境
- **Express** 4.18.2 - Web 框架
- **SQLite3** 5.1.6 - 数据库
- **Multer** - 文件上传处理
- **XLSX** - Excel 文件解析

## 📁 项目结构

```
financial-tax-system/
├── frontend/                 # 前端项目
│   ├── public/              # 静态资源
│   ├── src/
│   │   ├── components/      # React 组件
│   │   │   ├── common/      # 通用组件（Header, Sidebar, Footer）
│   │   │   └── pages/       # 页面组件
│   │   ├── pages/           # 主要页面
│   │   ├── services/        # API 服务
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑服务
│   │   └── app.js           # 应用入口
│   ├── database/            # SQLite 数据库文件
│   ├── uploads/             # 上传文件存储
│   └── package.json
│
└── data-templates/          # Excel 数据导入模板
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd financial-tax-system
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **安装前端依赖**
```bash
cd ../frontend
npm install
```

### 运行项目

1. **启动后端服务**
```bash
cd backend
npm run dev
# 或使用
npm start
```
后端服务将运行在 `http://localhost:3001`

2. **启动前端服务**（新开一个终端）
```bash
cd frontend
npm start
```
前端应用将运行在 `http://localhost:3000`

## 📖 功能说明

### 1. 企业管理
- 创建和管理企业档案
- 支持批量删除企业
- 企业信息导入导出

### 2. 数据导入
支持以下类型的 Excel 文件导入：
- 企业基本信息
- 资产负债表
- 利润表
- 税务申报表
- 发票数据
- 人事薪酬数据
- 科目余额表

**导入策略**：
- **追加模式** (append) - 新增数据，重复数据则更新
- **更新模式** (update) - 覆盖已有数据
- **跳过模式** (skip) - 跳过重复数据

### 3. 企业画像
系统自动根据导入的财务数据生成企业画像，包括：
- 基本信息概览
- 财务健康度分析
- 盈利能力指标
- 偿债能力指标
- 运营能力指标
- 发展能力指标
- 税务合规状态

### 4. 多期数据管理
- 支持多年度、多期间数据管理
- 按年、季度、月份查询数据
- 期间数据对比分析

## 🔧 API 接口

### 企业管理
- `GET /api/companies` - 获取企业列表
- `GET /api/companies/:id` - 获取企业详情
- `POST /api/companies` - 创建企业
- `DELETE /api/companies/:id` - 删除企业
- `DELETE /api/companies/batch` - 批量删除企业

### 企业画像
- `GET /api/companies/:id/profile` - 获取企业画像
- `GET /api/companies/:id/periods` - 获取可用报告期
- `GET /api/companies/:id/data-status` - 获取数据完整性状态

### 文件上传
- `POST /api/upload/batch/:companyId` - 批量上传文件
- `POST /api/upload/company-info/:companyId` - 上传企业信息
- `POST /api/upload/balance-sheet/:companyId` - 上传资产负债表
- `POST /api/upload/income-statement/:companyId` - 上传利润表
- `POST /api/upload/tax-reports/:companyId` - 上传税务申报表
- `POST /api/upload/invoice-data/:companyId` - 上传发票数据
- `POST /api/upload/hr-salary/:companyId` - 上传人事薪酬数据
- `POST /api/upload/account-balance/:companyId` - 上传科目余额表

## 📝 数据模板

在 `data-templates/` 目录下提供了标准化的 Excel 导入模板，包括：
- 企业基本信息模板
- 资产负债表模板
- 利润表模板
- 税务申报表模板
- 发票数据模板
- 人事薪酬模板
- 科目余额表模板

请按照模板格式准备数据文件，以确保导入成功。

## 🗄️ 数据库结构

系统使用 SQLite 数据库，主要数据表包括：

- `companies` - 企业信息表
- `balance_sheets` - 资产负债表
- `income_statements` - 利润表
- `tax_reports` - 税务申报表
- `invoices` - 发票数据表
- `hr_salary_data` - 人事薪酬表
- `account_balances` - 科目余额表
- `employees` - 员工信息表

## 🔒 用户类型

系统支持三种用户类型：
1. **企业用户** - 查看和管理本企业数据
2. **会计师用户** - 管理多个企业的财税数据
3. **集团用户** - 管理集团下属企业数据

## 🛠️ 开发指南

### 后端开发
```bash
cd backend
npm run dev  # 使用 nodemon 自动重启
```

### 前端开发
```bash
cd frontend
npm start    # 开发模式，支持热重载
```

### 代码规范
- 使用 ES6+ 语法
- 遵循 RESTful API 设计规范
- 组件化开发，保持代码可维护性

## 📦 构建部署

### 前端构建
```bash
cd frontend
npm run build
```
构建产物将生成在 `frontend/build/` 目录

### 生产环境运行
```bash
cd backend
npm start
```

## ⚠️ 注意事项

1. **数据安全**：生产环境请配置环境变量，不要将敏感信息硬编码
2. **文件大小限制**：单个文件上传限制为 10MB
3. **数据备份**：定期备份数据库文件
4. **浏览器兼容性**：推荐使用 Chrome、Firefox、Edge 最新版本

## 🐛 常见问题

### 1. 端口冲突
如果 3001 或 3000 端口被占用，可以修改：
- 后端：修改 `backend/src/app.js` 中的 `PORT` 变量
- 前端：创建 `.env` 文件设置 `PORT=3002`

### 2. 数据库初始化失败
删除 `backend/database/financial.db` 文件，重启后端服务自动重建

### 3. 文件上传失败
检查 `backend/uploads/` 目录是否存在且有写入权限

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至：[your-email@example.com]

---

**最后更新时间**: 2025-12-27
