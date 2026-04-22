const db = require('../db')

module.exports = (io) => {
  io.on('connection', (socket) => {

    socket.on('join_group', ({ groupId }) => {
      socket.join(`group_${groupId}`)
    })

    socket.on('user_online', async (userId) => {
      try {
        const result = await db.execute({
          sql: 'SELECT group_id FROM group_members WHERE user_id = ?',
          args: [userId]
        })
        for (const row of result.rows) {
          socket.join(`group_${row.group_id}`)
        }
      } catch (err) {
        console.error('获取用户群组失败：', err)
      }
    })

    socket.on('group_message', async ({ groupId, content, type = 'text', senderId }) => {
      try {
        await db.execute({
          sql: 'INSERT INTO group_messages (group_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
          args: [groupId, senderId, content, type]
        })

        io.to(`group_${groupId}`).emit('receive_group', {
          groupId, from: senderId, content, type,
          time: new Date().toISOString()
        })
      } catch (err) {
        console.error('群聊消息处理失败：', err)
      }
    })
  })
}