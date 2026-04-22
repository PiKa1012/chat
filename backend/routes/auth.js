const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })

    const exist = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] })
    if (exist.rows.length > 0) return res.status(400).json({ error: '用户名已被注册' })

    const hashed = await bcrypt.hash(password, 10)
    await db.execute({ sql: 'INSERT INTO users (username, password) VALUES (?, ?)', args: [username, hashed] })

    res.json({ message: '注册成功' })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] })
    const user = result.rows[0]

    if (!user) return res.status(400).json({ error: '用户不存在' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ error: '密码错误' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } })
  } catch (err) {
    res.status(500).json({ error: '服务器错误' })
  }
})

module.exports = router