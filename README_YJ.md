# 🚀 YJ AI Assistant - 部署指南

你的AI助手已经准备好了！现在需要部署到Vercel才能安全地运行。

## 📋 文件结构

```
Personal Website/
├── index.html              # 网站主页（已添加YJ按钮）
├── styles.css              # 样式（已添加YJ样式）
├── yj-assistant.js         # YJ前端逻辑
├── package.json            # Node.js配置
├── vercel.json             # Vercel配置
├── api/
│   └── chat.js             # 后端API（安全调用OpenAI）
└── README_YJ.md            # 这个文件
```

## 🔧 部署步骤

### 第1步：上传到GitHub

1. 在GitHub上创建新仓库：https://github.com/new
   - 仓库名：`personal-website` （或你喜欢的名字）
   - 选择 "Public"
   - **不要** 勾选"Initialize with README"

2. 在你的电脑上，打开终端，进入网站文件夹：

   ```bash
   cd "/Users/juyifan/Desktop/Academic/Personal Website"
   ```

3. 初始化Git并推送代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Add personal website with YJ AI assistant"
   git branch -M main
   git remote add origin https://github.com/你的GitHub用户名/personal-website.git
   git push -u origin main
   ```

### 第2步：连接Vercel

1. 访问 https://vercel.com
2. 用GitHub账号登录（Sign in with GitHub）
3. 点击 "New Project"
4. 找到你的 `personal-website` 仓库，点击 "Import"
5. 点击 "Deploy"（保持默认设置即可）
6. 等待部署完成（通常需要1-2分钟）

### 第3步：设置环境变量

1. 部署完成后，进入 "Settings" → "Environment Variables"
2. 添加新变量：
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `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`
3. 点击 "Save"
4. 重新部署（Vercel会自动重新部署）

### 第4步：测试

1. 打开你的Vercel部署链接（类似 `https://personal-website-xyz.vercel.app`）
2. 看到右下角的🔵火柴人按钮了吗？点击它！
3. 输入问题，比如：
   - "Tell me about Yifan"
   - "What projects has Yifan worked on?"
   - "What are Yifan's interests?"

---

## ⚠️ 安全说明

✅ **你的API密钥现在是安全的**：

- 密钥存储在Vercel服务器上（不会暴露）
- 前端只是调用 `/api/chat` 端点
- 没有人能从浏览器看到你的密钥

❌ **重要**：

- 这个密钥只能一次性使用，不要再分享给任何人
- 如果被泄露，立即在 https://platform.openai.com/account/api-keys 删除并创建新的

---

## 🎯 使用YJ助手

### 前端用户可以：

- 点击右下角的蓝色按钮打开对话框
- 提出任何关于Yifan的问题
- 了解他的项目、技能、爱好等

### YJ知道的信息：

- ✅ Yifan的背景、教育、项目
- ✅ 技术技能和专业领域
- ✅ 兴趣和爱好
- ✅ 联系方式（邮箱、GitHub等）

---

## 📊 费用追踪

OpenAI API使用情况可以在这里查看：
https://platform.openai.com/account/usage/overview

成本应该非常低（$0.01-0.10/月），因为访客较少。

---

## 🐛 如果出现问题

### 对话无法发送

1. 检查环境变量是否正确设置
2. 在浏览器DevTools (F12) → Console查看错误信息
3. 确保Vercel已重新部署（Settings中重新部署）

### 助手没有回复

1. 检查API配额是否已用完
2. 查看https://platform.openai.com/account/usage/overview

### 按钮不显示

1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 硬刷新（Ctrl+F5）

---

## 🎨 自定义YJ

想改变YJ的个性、外观或功能？编辑这些文件：

- **YJ的人格**：编辑 `yj-assistant.js` 中的 `buildSystemPrompt()` 函数
- **UI颜色**：编辑 `styles.css` 中的YJ相关部分
- **火柴人形象**：编辑 `index.html` 中的 `<svg>` 部分

修改后推送到GitHub，Vercel会自动重新部署！

---

## ✨ 完成！

你的AI助手现在已经上线了！🎉

访问你的网站，点击右下角的YJ按钮，开始聊天吧！

有任何问题，随时告诉我！😊
