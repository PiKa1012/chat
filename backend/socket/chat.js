const db = require('../db')

const onlineUsers = new Map()

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('有用户连接了：', socket.id)  // ← 加这行

    socket.on('user_online', (userId) => {
      console.log('user_online 收到：', userId)  // ← 加这行
      socket.userId = String(userId)
      onlineUsers.set(String(userId), socket.id)
      socket.join(`user_${userId}`)
    })

    socket.on('private_message', async ({ to, content, type = 'text' }) => {
      console.log('private_message 收到：', { to, content, type })  // ← 加这行
      try {
        const senderId = socket.userId
        if (!senderId) {
          console.error('senderId 为空，用户可能没有发送 user_online')
          return
        }

        await db.execute({
          sql: 'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)',
          args: [senderId, to, content, type]
        })

        io.to(`user_${to}`).emit('receive_private', {
          from: senderId, content, type,
          time: new Date().toISOString()
        })
      } catch (err) {
        console.error('私聊消息处理失败：', err)
      }
    })

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId)
      }
    })
  })
}