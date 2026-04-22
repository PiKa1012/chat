# MyChat App

IM 聊天软件 - Electron + React + Socket.IO

## 部署说明

### 后端部署 (Railway)

1. 登录 [Railway](https://railway.app)（用 GitHub 账号）
2. New Project → 从 GitHub 导入 `chat` 仓库
3. 添加数据库（可选，Turso/SQLite）
4. 添加环境变量：
   - `JWT_SECRET` - 随机字符串
   - `TURSO_URL` - Turso 数据库地址（如果用 Turso）
   - `TURSO_TOKEN` - Turso 密钥
5. 部署后获取 URL（如 `https://my-chat-app.up.railway.app`）
6. 更新 `frontend/src/config.js` 中的生产环境 URL

### 本地运行

```bash
# 后端
cd backend && npm install && npm start

# 前端
cd frontend && npm install && npm run dev
```

### 打包桌面应用

```bash
cd frontend && npm run build:electron
```