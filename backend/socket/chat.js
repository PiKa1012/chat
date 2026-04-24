const db = require('../db')

const onlineUsers = new Map()

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('有用户连接了：', socket.id)

    socket.on('user_online', (userId) => {
      console.log('user_online 收到：', userId)
      socket.userId = String(userId)
      onlineUsers.set(String(userId), socket.id)
      socket.join(`user_${userId}`)
      db.execute({
        sql: 'SELECT group_id FROM group_members WHERE user_id = ?',
        args: [userId]
      }).then(result => {
        for (const row of result.rows) {
          socket.join(`group_${row.group_id}`)
        }
      }).catch(err => console.error('获取用户群组失败：', err))
    })

    socket.on('join_group', ({ groupId }) => {
      socket.join(`group_${groupId}`)
    })

    socket.on('private_message', async ({ to, content, type = 'text' }) => {
      console.log('private_message 收到：', { to, content, type })
      try {
        const senderId = socket.userId
        if (!senderId) { console.error('senderId 为空'); return }
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

    socket.on('group_message', async ({ groupId, content, type = 'text', time }) => {
      const senderId = socket.userId
      if (!senderId) { console.error('senderId 为空'); return }
      try {
        await db.execute({
          sql: 'INSERT INTO group_messages (group_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
          args: [groupId, senderId, content, type]
        })
        io.to(`group_${groupId}`).emit('receive_group', {
          groupId, from: senderId, content, type,
          time: time || new Date().toISOString()
        })
      } catch (err) {
        console.error('群聊消息处理失败：', err)
      }
    })

    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(socket.userId)
    })
  })
}
