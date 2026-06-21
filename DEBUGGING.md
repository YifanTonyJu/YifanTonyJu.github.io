# 调试指南

## 实时查看 Vercel 日志

### 方法 1：使用日志监控脚本（推荐）

在新的终端窗口中运行：

```bash
npm run logs
```

这会在 `vercel-logs.txt` 文件中记录所有日志，每 5 秒更新一次。

**查看日志：**
- VS Code 中直接打开 `vercel-logs.txt` 文件
- 或在终端中运行：`tail -f vercel-logs.txt`

### 方法 2：使用 Vercel CLI 查看实时日志

```bash
vercel logs --follow
```

### 方法 3：查看浏览器控制台错误

打开网站后：
1. 按 `F12` 打开开发者工具
2. 进入 **Console** 标签
3. 进行操作（如点击麦克风说话）
4. 在 Console 中查看所有错误信息

## 常见错误及解决方案

### 400 错误 - Bad Request
- 检查音频数据格式
- 确认 API 调用的参数正确
- 查看详细的 API 返回错误信息

### 500 错误 - Internal Server Error  
- 查看服务器日志中的完整错误信息
- 检查环境变量是否正确设置

### 405 错误 - Method Not Allowed
- 确认 `vercel.json` 中的路由配置正确
- 检查 API 端点是否支持 POST 方法

## 日志文件位置

- **Vercel 日志**: `vercel-logs.txt`（自动更新）
- **源代码**: 各个 API 文件中都有 `console.log()` 输出

## 调试 API 调用

### 前端
在 `yj-assistant.js` 中可以看到：
- `console.log('Recording started')` - 录音开始
- `console.log('Sending to /api/transcribe')` - 发送请求

### 后端
在 `api/transcribe.js` 中的日志：
- `📦 Audio buffer size` - 音频数据大小
- `📤 Total payload size` - 发送的总数据量
- `📊 Whisper API response status` - API 返回状态
- `📝 Whisper API response` - API 返回内容

## 快速诊断流程

1. 运行 `npm run logs` 启动日志监控
2. 打开网站并进行操作
3. 在 `vercel-logs.txt` 中查看所有日志
4. 根据日志信息快速定位问题

## 重要提示

⚠️ **日志文件不要提交到 Git**（已在 `.gitignore` 中）

✅ **推荐做法**：
- 边开发边运行 `npm run logs`
- 实时查看日志进行调试
- 完成后停止监控脚本（Ctrl+C）
