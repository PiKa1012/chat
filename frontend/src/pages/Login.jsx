import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import socket from '../socket'

const C = {
  accent: '#07c160', accentHover: '#06a050',
  bg: '#f0f2f5', text: '#1a1a1a', textMuted: '#9e9e9e',
  inputBorder: '#dde1e7', danger: '#f44336',
}

const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif; background: ${C.bg}; }
  input { font-family: inherit; outline: none; }
  button { font-family: inherit; cursor: pointer; border: none; outline: none; }
`

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await axios.post(`${config.API_URL}/api/auth/login`, { username, password })
      const { token, user } = res.data
      socket.connect()
      socket.emit('user_online', user.id)
      navigate('/chat', { state: { user, token } })
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查用户名和密码')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>MyChat</h1>
            <p style={{ fontSize: 13, color: C.textMuted }}>登录你的账号</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>用户名</label>
              <input
                placeholder="输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${C.inputBorder}`, fontSize: 14, color: C.text, background: '#f8f9fa', transition: 'border 0.15s' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.inputBorder}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>密码</label>
              <input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${C.inputBorder}`, fontSize: 14, color: C.text, background: '#f8f9fa', transition: 'border 0.15s' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.inputBorder}
              />
            </div>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ height: 46, borderRadius: 12, background: loading ? C.inputBorder : C.accent, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!loading) e.target.style.background = C.accentHover }}
              onMouseLeave={e => { if (!loading) e.target.style.background = C.accent }}
            >{loading ? '登录中...' : '登录'}</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: C.textMuted }}>
            没有账号？{' '}
            <Link to="/register" style={{ color: C.accent, fontWeight: 600, textDecoration: 'none' }}>立即注册</Link>
          </p>
        </div>
      </div>
    </>
  )
}
