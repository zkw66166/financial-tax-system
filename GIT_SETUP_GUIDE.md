# Git 版本控制初始化指南

## 📋 准备工作

### 1. 安装 Git

如果您的系统还没有安装 Git，请按照以下步骤安装：

#### Windows 系统

1. 访问 Git 官网：<https://git-scm.com/download/win>
2. 下载 Git for Windows 安装程序
3. 运行安装程序，使用默认设置即可
4. 安装完成后，重启 PowerShell 或命令提示符

#### 验证安装

```bash
git --version
```

## 🚀 初始化 Git 仓库

### 步骤 1: 配置 Git 用户信息（首次使用）

```bash
git config --global user.name "您的姓名"
git config --global user.email "您的邮箱@example.com"
```

### 步骤 2: 初始化仓库

在项目根目录执行：

```bash
# 进入项目目录
cd d:\MyProjects\financial-tax-system

# 初始化 Git 仓库
git init

# 查看状态
git status
```

### 步骤 3: 添加文件到暂存区

```bash
# 添加所有文件（.gitignore 会自动排除不需要的文件）
git add .

# 查看将要提交的文件
git status
```

### 步骤 4: 创建首次提交

```bash
git commit -m "Initial commit: 财税管理系统项目初始化

- 清理所有备份文件
- 添加 .gitignore 配置
- 创建 README.md 项目文档
- 初始化前后端项目结构"
```

## 📝 日常 Git 使用

### 查看状态

```bash
git status
```

### 添加修改的文件

```bash
# 添加特定文件
git add 文件路径

# 添加所有修改
git add .
```

### 提交更改

```bash
git commit -m "描述本次修改的内容"
```

### 查看提交历史

```bash
# 查看简洁历史
git log --oneline

# 查看详细历史
git log
```

### 创建分支

```bash
# 创建新分支
git branch feature/新功能名称

# 切换到新分支
git checkout feature/新功能名称

# 或者一步完成（创建并切换）
git checkout -b feature/新功能名称
```

### 合并分支

```bash
# 切换到主分支
git checkout main

# 合并其他分支
git merge feature/新功能名称
```

## 🌐 连接远程仓库（可选）

### GitHub / GitLab / Gitee

1. 在平台上创建新仓库
2. 添加远程仓库地址：

```bash
# 添加远程仓库
git remote add origin https://github.com/用户名/仓库名.git

# 推送到远程仓库
git push -u origin main
```

## 📌 推荐的分支策略

### 主要分支

- `main` (或 `master`) - 主分支，保持稳定可发布状态
- `develop` - 开发分支，日常开发在此进行

### 功能分支

- `feature/功能名` - 新功能开发
- `bugfix/问题描述` - Bug 修复
- `hotfix/紧急修复` - 生产环境紧急修复

### 创建开发分支示例

```bash
# 创建开发分支
git checkout -b develop

# 创建功能分支（从 develop 分支创建）
git checkout develop
git checkout -b feature/user-authentication

# 功能完成后合并回 develop
git checkout develop
git merge feature/user-authentication

# 删除已合并的功能分支
git branch -d feature/user-authentication
```

## 💡 提交信息规范

推荐使用以下格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
git commit -m "feat(upload): 添加批量文件上传功能

- 支持同时上传多个 Excel 文件
- 添加导入策略选择（追加/更新/跳过）
- 优化文件类型识别逻辑"
```

## 🔧 常用 Git 命令速查

```bash
# 查看状态
git status

# 查看差异
git diff

# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存区文件
git reset HEAD 文件名

# 查看提交历史
git log --oneline --graph --all

# 查看某个文件的修改历史
git log -p 文件名

# 暂存当前修改
git stash

# 恢复暂存的修改
git stash pop

# 查看远程仓库
git remote -v

# 拉取远程更新
git pull

# 推送到远程
git push
```

## ⚠️ 注意事项

1. **提交前检查**：使用 `git status` 和 `git diff` 检查修改
2. **频繁提交**：小步提交，每次提交一个逻辑单元
3. **有意义的提交信息**：清晰描述本次修改的内容和原因
4. **不要提交敏感信息**：检查 .gitignore 是否正确配置
5. **定期推送**：及时推送到远程仓库备份

## 📚 学习资源

- [Git 官方文档](https://git-scm.com/doc)
- [Pro Git 中文版](https://git-scm.com/book/zh/v2)
- [Git 可视化学习](https://learngitbranching.js.org/?locale=zh_CN)

---

**提示**：本项目已经完成以下准备工作：

- ✅ 清理了所有备份文件
- ✅ 创建了 .gitignore 文件
- ✅ 创建了 README.md 文档
- ✅ 创建了必要的 .gitkeep 文件

**下一步**：安装 Git 后，按照上述步骤初始化仓库并创建首次提交。
