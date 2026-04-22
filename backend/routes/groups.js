const express = require('express')
const router = express.Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

router.use(authMiddleware)

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const result = await db.execute({
      sql: 'INSERT INTO groups_table (name, owner_id) VALUES (?, ?)',
      args: [name, req.userId]
    })
    const groupId = result.lastInsertRowid
    await db.execute({
      sql: 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      args: [groupId, req.userId]
    })
    res.json({ id: groupId, name })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/list', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT g.id, g.name FROM groups_table g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?`,
      args: [req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/join', async (req, res) => {
  try {
    const { groupId, friendId } = req.body
    const targetUserId = friendId || req.userId
    const exist = await db.execute({
      sql: 'SELECT * FROM groups_table WHERE id = ?',
      args: [groupId]
    })
    if (exist.rows.length === 0) return res.status(404).json({ error: '群不存在' })
    const memberExist = await db.execute({
      sql: 'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [groupId, targetUserId]
    })
    if (memberExist.rows.length > 0) return res.status(400).json({ error: '已在群中' })

    await db.execute({
      sql: 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      args: [groupId, targetUserId]
    })
    res.json({ message: friendId ? '已邀请入群' : '已加入' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.avatar FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = ?`,
      args: [groupId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/:groupId/history', async (req, res) => {
  try {
    const { groupId } = req.params
    const result = await db.execute({
      sql: `SELECT gm.*, u.username FROM group_messages gm
            JOIN users u ON u.id = gm.sender_id
            WHERE gm.group_id = ?
            ORDER BY gm.created_at ASC`,
      args: [groupId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.delete('/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params
    await db.execute({
      sql: 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [groupId, req.userId]
    })
    res.json({ message: '已退出群' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router