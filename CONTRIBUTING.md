# 贡献指南 (Contributing Guide)

感谢您对财税管理系统项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](../../issues) 确认问题是否已被报告
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 期望的行为
   - 实际的行为
   - 截图（如果适用）
   - 环境信息（操作系统、浏览器、Node.js 版本等）

### 提出新功能

如果您有新功能的想法：

1. 先创建 Issue 讨论该功能的必要性和实现方案
2. 等待维护者反馈
3. 获得批准后再开始开发

### 提交代码

1. **Fork 项目**

   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆您的 Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/financial-tax-system.git
   cd financial-tax-system
   ```

3. **创建功能分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **进行开发**
   - 遵循项目的代码规范
   - 添加必要的测试
   - 更新相关文档

5. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

6. **推送到您的 Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

## 📝 代码规范

### JavaScript/React 规范

- 使用 ES6+ 语法
- 使用函数式组件和 Hooks
- 组件名使用 PascalCase
- 文件名使用 camelCase 或 PascalCase
- 变量和函数名使用 camelCase
- 常量使用 UPPER_SNAKE_CASE

### 代码风格

```javascript
// ✅ 好的示例
const getUserData = async (userId) => {
  try {
    const response = await apiService.getUser(userId);
    return response.data;
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  }
};

// ❌ 不好的示例
function get_user_data(user_id) {
  return apiService.getUser(user_id).then(res => res.data).catch(err => console.log(err));
}
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具变动

**示例**：

```
feat(upload): 添加批量文件上传功能

- 支持同时上传多个文件
- 添加上传进度显示
- 优化错误处理

Closes #123
```

## 🧪 测试

在提交 PR 前，请确保：

- [ ] 代码能够正常运行
- [ ] 没有引入新的警告或错误
- [ ] 相关功能已测试
- [ ] 文档已更新

### 运行测试

```bash
# 前端测试
cd frontend
npm test

# 后端测试
cd backend
npm test
```

## 📚 开发环境设置

1. **安装依赖**

   ```bash
   # 后端
   cd backend
   npm install

   # 前端
   cd frontend
   npm install
   ```

2. **配置环境变量**

   ```bash
   # 复制环境变量模板
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **启动开发服务器**

   ```bash
   # 后端（终端 1）
   cd backend
   npm run dev

   # 前端（终端 2）
   cd frontend
   npm start
   ```

## 🔍 代码审查流程

1. 提交 PR 后，维护者会进行代码审查
2. 如有需要修改的地方，会在 PR 中评论
3. 根据反馈修改代码并推送更新
4. 审查通过后，PR 将被合并

## 📋 Pull Request 检查清单

提交 PR 前，请确认：

- [ ] 代码遵循项目规范
- [ ] 提交信息清晰明确
- [ ] 已测试所有修改
- [ ] 更新了相关文档
- [ ] 没有合并冲突
- [ ] PR 描述清楚说明了改动内容

## 🎯 优先级任务

当前项目需要帮助的领域：

- [ ] 添加单元测试和集成测试
- [ ] 完善 API 文档
- [ ] 优化性能
- [ ] 改进用户界面
- [ ] 添加数据可视化功能
- [ ] 国际化支持

## 💬 交流讨论

- **Issues**: 用于 Bug 报告和功能请求
- **Discussions**: 用于一般性讨论和问题
- **Email**: [your-email@example.com]

## 📜 行为准则

参与本项目即表示您同意遵守以下准则：

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性的批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

再次感谢您的贡献！如有任何问题，请随时联系我们。
