const express = require('express')
const router = express.Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

router.use(authMiddleware)

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    const result = await db.execute({
      sql: 'SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ?',
      args: [`%${q}%`, req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/request', async (req, res) => {
  try {
    const { friendId } = req.body
    if (friendId == req.userId) return res.status(400).json({ error: '不能添加自己' })

    const exist = await db.execute({
      sql: 'SELECT id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      args: [req.userId, friendId, friendId, req.userId]
    })
    if (exist.rows.length > 0) return res.status(400).json({ error: '申请已存在' })

    await db.execute({
      sql: 'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
      args: [req.userId, friendId, 'pending']
    })
    res.json({ message: '申请已发送' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/accept', async (req, res) => {
  try {
    const { friendId } = req.body
    await db.execute({
      sql: "UPDATE friendships SET status = 'accepted' WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
      args: [friendId, req.userId]
    })
    res.json({ message: '已接受' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/list', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.avatar FROM friendships f
            JOIN users u ON (u.id = CASE WHEN f.friend_id = ? THEN f.user_id ELSE f.friend_id END)
            WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted' AND u.id != ?`,
      args: [req.userId, req.userId, req.userId, req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/pending', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.avatar FROM friendships f
            JOIN users u ON u.id = f.user_id
            WHERE f.friend_id = ? AND f.status = 'pending'`,
      args: [req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.delete('/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params
    await db.execute({
      sql: 'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      args: [req.userId, friendId, friendId, req.userId]
    })
    res.json({ message: '已删除' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/history/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params
    const result = await db.execute({
      sql: `SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC`,
      args: [req.userId, friendId, friendId, req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router