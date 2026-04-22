import { useLocation, useNavigate } from 'react-router-dom'

const C = {
  accent: '#07c160', accentHover: '#06a050',
  bg: '#f0f2f5', text: '#1a1a1a', textMuted: '#9e9e9e',
  inputBorder: '#dde1e7',
}

export default function Profile() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token } = location.state || {}

  if (!user) { navigate('/'); return null }

  const colors = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#9775fa','#f783ac']
  const avatarBg = colors[(user.username?.charCodeAt(0) || 0) % colors.length]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif" }}>
      <div style={{ width: 340, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
        {/* Banner */}
        <div style={{ height: 80, background: `linear-gradient(135deg, ${C.accent}, #4dabf7)` }} />

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -36 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarBg, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', userSelect: 'none' }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        </div>

        <div style={{ padding: '12px 28px 28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>{user.username}</h2>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>UID: {user.id}</p>

          <div style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '用户名', value: user.username },
              { label: '用户 ID', value: user.id },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/chat', { state: { user, token } })}
            style={{ width: '100%', height: 44, borderRadius: 12, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = C.accentHover}
            onMouseLeave={e => e.target.style.background = C.accent}
          >← 返回聊天</button>
        </div>
      </div>
    </div>
  )
}
