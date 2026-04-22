require('dotenv').config()
const { createClient } = require('@libsql/client')

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
})

// 加这段，启动时测试连接
db.execute('SELECT 1')
  .then(() => console.log('✅ Turso 数据库连接成功'))
  .catch(err => console.error('❌ Turso 数据库连接失败：', err))

module.exports = db