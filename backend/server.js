require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

// 只在这里配置CORS！外面不再重复开CORS！！！
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://chat-production-d143.up.railway.app' // 加上你自己的线上域名！！！
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// 删掉外面重复的app.use(cors())！！！这里彻底注释掉！！！
// app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/friends', require('./routes/friends'))
app.use('/api/groups', require('./routes/groups'))

require('./socket/chat')(io)
require('./socket/group')(io)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})