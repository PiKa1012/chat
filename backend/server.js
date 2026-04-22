require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:3000',
      ]
      if (!origin || allowed.includes(origin) || origin === 'null') {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    methods: ['GET', 'POST']
  }
})

app.use(cors())
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