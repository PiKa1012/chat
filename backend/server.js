require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

// 全开跨域
app.use(cors())
app.use(express.json())

// 测试接口
app.get('/health', (req, res) => {
  res.send('ok')
})

app.get('/test-write', async (req, res) => {
  try {
    const db = require('./db')
    await db.execute({
      sql: 'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)',
      args: [1, 1, 'test message', 'text']
    })
    res.send('写入成功')
  } catch (err) {
    res.send('写入失败：' + err.message)
  }
})


// 业务路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/friends', require('./routes/friends'))
app.use('/api/groups', require('./routes/groups'))


const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
require('./socket/chat')(io)

// 固定 Railway 必须的配置
const PORT = process.env.PORT || 8080
server.listen(PORT, "0.0.0.0", () => {
  console.log('服务启动成功：' + PORT)
})
