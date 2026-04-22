#!/bin/bash
# 进入后端文件夹
cd backend
# 自动安装后端所有依赖
npm install
# 启动你的Socket.IO后端服务
node server.js