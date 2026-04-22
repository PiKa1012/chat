const db = require('../db')

const onlineUsers = new Map()

module.exports = (io) => {
  io.on('connection', (socket) => {

    socket.on('user_online', (userId) => {
      onlineUsers.set(String(userId), socket.id)
      socket.join(`user_${userId}`)
    })

    socket.on('private_message', async ({ to, content, type = 'text' }) => {
      try {
        let senderId = null
        for (const [uid, sid] of onlineUsers.entries()) {
          if (sid === socket.id) { senderId = uid; break }
        }
        if (!senderId) return

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
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid)
          break
        }
      }
    })
  })
}