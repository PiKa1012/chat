import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import socket from '../socket'

/* ─────────────── Design Tokens ─────────────── */
const C = {
  bg: '#f0f2f5',
  sidebar: '#ffffff',
  sidebarBorder: '#e8eaed',
  accent: '#07c160',
  accentHover: '#06a050',
  accentLight: '#e8f8ef',
  text: '#1a1a1a',
  textMuted: '#9e9e9e',
  bubble: '#ffffff',
  bubbleSelf: '#95ec69',
  header: '#ffffff',
  modalBg: 'rgba(0,0,0,0.45)',
  danger: '#f44336',
  dangerHover: '#d32f2f',
  warning: '#ff9800',
  selected: '#f0fbf4',
  hover: '#f7f8fa',
  divider: '#f0f0f0',
  inputBorder: '#dde1e7',
  shadow: '0 2px 12px rgba(0,0,0,0.08)',
  shadowStrong: '0 8px 32px rgba(0,0,0,0.18)',
}

/* ─────────────── Global CSS ─────────────── */
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif; background: ${C.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }
  input, textarea, button { font-family: inherit; outline: none; }
  .chat-item { transition: background 0.15s; cursor: pointer; }
  .chat-item:hover { background: ${C.hover}; }
  .chat-item.active { background: ${C.selected}; }
  .del-btn { opacity: 0; transition: opacity 0.15s; }
  .chat-item:hover .del-btn { opacity: 1; }
  @keyframes fadeIn  { from { opacity:0; transform:scale(0.94) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(14px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  @keyframes toastOut { from { opacity:1; transform:translateX(-50%) translateY(0); } to { opacity:0; transform:translateX(-50%) translateY(-8px); } }
  .modal-box { animation: fadeIn 0.18s cubic-bezier(.2,.8,.4,1); }
  .msg-bubble { animation: slideUp 0.15s ease; }
`

/* ═══════════════════════════════════════════════════════
   Toast — 替代 alert()
   完全在渲染进程内实现，不调用任何系统原生弹窗，不抢焦点
   ═══════════════════════════════════════════════════════ */
function Toast({ toasts }) {
  return (
    <div style={{ position:'fixed', top:24, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => {
        const map = {
          success: { bg:'#f0fbf4', border:'#07c160', iconBg:'#07c160', icon:'✓' },
          error:   { bg:'#fff5f5', border:'#f44336', iconBg:'#f44336', icon:'✕' },
          info:    { bg:'#f0f7ff', border:'#2196f3', iconBg:'#2196f3', icon:'i' },
          warning: { bg:'#fffbf0', border:'#ff9800', iconBg:'#ff9800', icon:'!' },
        }
        const s = map[t.type] || map.info
        return (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 18px 10px 12px',
            background:s.bg, border:`1px solid ${s.border}`,
            borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.13)',
            animation: t.leaving ? 'toastOut 0.25s ease forwards' : 'toastIn 0.25s ease',
            pointerEvents:'auto', minWidth:180, maxWidth:340,
          }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:s.iconBg, color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
            <span style={{ fontSize:13, color:C.text, lineHeight:1.4 }}>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ConfirmDialog — 替代 confirm()
   完全在渲染进程内实现，不调用任何系统原生弹窗，不抢焦点
   ═══════════════════════════════════════════════════════ */
function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null
  return (
    <div style={{ position:'fixed', inset:0, background:C.modalBg, display:'flex', alignItems:'center', justifyContent:'center', zIndex:8000 }}>
      <div className="modal-box" style={{ background:'#fff', borderRadius:16, padding:'28px 28px 22px', width:300, boxShadow:C.shadowStrong, textAlign:'center' }}>
        <div style={{ fontSize:38, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>确认操作</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:24, lineHeight:1.6 }}>{dialog.message}</div>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onCancel}
            style={{ flex:1, height:40, borderRadius:10, background:C.hover, border:`1px solid ${C.inputBorder}`, fontSize:14, color:C.textMuted, cursor:'pointer', fontWeight:600, transition:'all 0.15s' }}
            onMouseEnter={e => e.target.style.background='#ececec'}
            onMouseLeave={e => e.target.style.background=C.hover}
          >取消</button>
          <button
            onClick={onConfirm}
            style={{ flex:1, height:40, borderRadius:10, background:C.danger, border:'none', fontSize:14, color:'#fff', cursor:'pointer', fontWeight:600, transition:'background 0.15s' }}
            onMouseEnter={e => e.target.style.background=C.dangerHover}
            onMouseLeave={e => e.target.style.background=C.danger}
          >确定</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Avatar ─────────────── */
function Avatar({ name='?', size=36, color }) {
  const palette = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#9775fa','#f783ac','#63e6be']
  const bg = color || palette[(name.charCodeAt(0)||0) % palette.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:size*0.42, fontWeight:700, flexShrink:0, userSelect:'none' }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  )
}

/* ─────────────── Info Modal ─────────────── */
function Modal({ show, onClose, title, children, width=320 }) {
  if (!show) return null
  return (
    <div style={{ position:'fixed', inset:0, background:C.modalBg, display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000 }}
      onMouseDown={e => { if (e.target===e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ background:'#fff', borderRadius:16, width, padding:28, boxShadow:C.shadowStrong }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ fontWeight:700, fontSize:16, color:C.text }}>{title}</span>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:C.hover, border:'none', fontSize:13, color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─────────────── Section Label ─────────────── */
function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:'0.06em', textTransform:'uppercase', padding:'12px 16px 6px', userSelect:'none' }}>{children}</div>
}

/* ─────────────── Sidebar Input Row ─────────────── */
function SideInput({ placeholder, value, onChange, onAction, actionLabel, inputRef }) {
  return (
    <div style={{ display:'flex', gap:6, padding:'0 12px 8px' }}>
      <input ref={inputRef} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={e=>e.key==='Enter'&&onAction()}
        style={{ flex:1, height:32, padding:'0 10px', borderRadius:8, border:`1px solid ${C.inputBorder}`, fontSize:13, color:C.text, background:C.bg, transition:'border 0.15s' }}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>e.target.style.borderColor=C.inputBorder}
      />
      <button onClick={onAction}
        style={{ padding:'0 12px', height:32, borderRadius:8, background:C.accent, color:'#fff', fontSize:12, fontWeight:600, border:'none', transition:'background 0.15s', flexShrink:0, cursor:'pointer' }}
        onMouseEnter={e=>e.target.style.background=C.accentHover}
        onMouseLeave={e=>e.target.style.background=C.accent}
      >{actionLabel}</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Main Chat Component
   ═══════════════════════════════════════════════════════ */
export default function Chat() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: userFromState, token: tokenFromState } = location.state || {}
  const [user] = useState(() => {
    const stored = sessionStorage.getItem('user')
    return stored ? JSON.parse(stored) : userFromState
  })
  const [token] = useState(() => sessionStorage.getItem('token') || tokenFromState)

  useEffect(() => {
    if (user) { sessionStorage.setItem('user', JSON.stringify(user)); sessionStorage.setItem('token', token) }
  }, [user, token])

  // ── Data ──
  const [friends, setFriends] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [unread, setUnread] = useState({})
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [joinGroupId, setJoinGroupId] = useState('')
  const [inputText, setInputText] = useState('')
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [groupInfo, setGroupInfo] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const sentMsgRef = useRef({})

  // ── Toast state (替代 alert) ──
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  // ── Confirm state (替代 confirm) ──
  const [confirmDialog, setConfirmDialog] = useState(null)

  // ── Refs ──
  const messageInputRef = useRef(null)
  const groupNameInputRef = useRef(null)
  const joinGroupInputRef = useRef(null)
  const searchInputRef = useRef(null)
  const emojiRef = useRef(null)

  /* ── Toast：不调用系统 alert，不产生焦点问题 ── */
  const showToast = useCallback((message, type='info', duration=2800) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type, leaving:false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id===id ? { ...t, leaving:true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id!==id)), 280)
    }, duration)
  }, [])

  /* ── Confirm：不调用系统 confirm，返回 Promise，不产生焦点问题 ── */
  const showConfirm = useCallback((message) => {
    return new Promise(resolve => setConfirmDialog({ message, resolve }))
  }, [])

  const handleConfirmYes = useCallback(() => {
    const resolve = confirmDialog?.resolve
    setConfirmDialog(null)
    // 先归还焦点，再执行后续逻辑
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus()
        resolve?.(true)
      })
    })
  }, [confirmDialog])

  const handleConfirmNo = useCallback(() => {
    const resolve = confirmDialog?.resolve
    setConfirmDialog(null)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus()
        resolve?.(false)
      })
    })
  }, [confirmDialog])

  /* ── Modal close + 焦点归还 ── */
  const closeModal = useCallback((setter) => {
    setter(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => messageInputRef.current?.focus())
    })
  }, [])

  /* ── Init ── */
  useEffect(() => {
  if (!user) { navigate('/'); return }
  loadFriends(); loadGroups(); loadPending()
  
  socket.on('connect', () => {
    socket.emit('user_online', user.id)
  })
  
  socket.connect()
  
  return () => {
    socket.off('connect')
    socket.disconnect()
  }
}, [])

  useEffect(() => {
    socket.off('receive_private')
    socket.off('receive_group')
    socket.on('receive_private', data => {
      if (String(data.from) === String(user.id)) return
      if (selectedChat?.id == data.from) setMessages(prev => [...prev, data])
      else setUnread(prev => ({ ...prev, [data.from]: (prev[data.from]||0)+1 }))
    })
    socket.on('receive_group', data => {
      if (selectedChat?.id == data.groupId) setMessages(prev => [...prev, data])
    })
  }, [selectedChat])

  // 关闭表情面板（点击外部）
  useEffect(() => {
    const handler = e => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── API ── */
  const h = { Authorization: 'Bearer ' + token }
  const loadFriends  = async () => { const r = await axios.get(config.API_URL+'/api/friends/list',   { headers:h }); setFriends(r.data) }
  const loadGroups   = async () => { const r = await axios.get(config.API_URL+'/api/groups/list',    { headers:h }); setGroups(r.data) }
  const loadPending  = async () => { const r = await axios.get(config.API_URL+'/api/friends/pending', { headers:h }); setPendingRequests(r.data) }

  const searchUsers = async () => {
    if (!searchQ.trim()) return
    try { const r = await axios.get(config.API_URL+'/api/friends/search?q='+searchQ, { headers:h }); setSearchResults(r.data||[]) }
    catch { setSearchResults([]) }
  }

  const addFriend = async (friendId) => {
    await axios.post(config.API_URL+'/api/friends/request', { friendId }, { headers:h })
    setSearchResults(prev => prev.filter(u => u.id!==friendId))
    showToast('好友申请已发送', 'success')           // ✅ 替代 alert()
  }

  const acceptFriend = async (friendId) => {
    await axios.post(config.API_URL+'/api/friends/accept', { friendId }, { headers:h })
    loadPending(); loadFriends()
    showToast('已接受好友申请', 'success')            // ✅ 替代 alert()
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    const res = await axios.post(config.API_URL+'/api/groups', { name:newGroupName }, { headers:h })
    setNewGroupName('')
    loadGroups()
    setGroups(prev => [...prev, { id:res.data.id, name:res.data.name }])
    showToast(`群 "${res.data.name}" 创建成功！群ID: ${res.data.id}`, 'success')  // ✅ 替代 alert()
  }

  const viewGroupMembers = async (groupId) => {
    const res = await axios.get(config.API_URL+'/api/groups/'+groupId+'/members', { headers:h })
    setGroupMembers(res.data)
    setGroupInfo(groups.find(g => g.id===groupId))
    setShowGroupModal(true)
  }

  const inviteFriend = async (friendId) => {
    axios.post(config.API_URL+'/api/groups/join', { groupId:selectedChat.id, friendId }, { headers:h })
      .then(()  => showToast('已邀请好友入群', 'success'))                         // ✅ 替代 alert()
      .catch(err => showToast(err.response?.data?.error||'已在群中或邀请失败','error'))  // ✅ 替代 alert()
    closeModal(setShowInviteModal)
  }

  const joinGroup = async () => {
    if (!joinGroupId.trim()) return
    try {
      await axios.post(config.API_URL+'/api/groups/join', { groupId:parseInt(joinGroupId) }, { headers:h })
      setJoinGroupId(''); loadGroups()
      showToast('已成功加入群', 'success')            // ✅ 替代 alert()
    } catch(err) {
      showToast(err.response?.data?.error||'加入群失败', 'error')  // ✅ 替代 alert()
    }
  }

  const deleteFriend = async (friendId) => {
    const yes = await showConfirm('确定要删除该好友吗？')   // ✅ 替代 confirm()
    if (!yes) return
    await axios.delete(config.API_URL+'/api/friends/'+friendId, { headers:h })
    loadFriends()
    if (selectedChat?.id===friendId) setSelectedChat(null)
    showToast('已删除好友', 'info')
  }

  const leaveGroup = async (groupId) => {
    const yes = await showConfirm('确定要退出该群吗？')     // ✅ 替代 confirm()
    if (!yes) return
    await axios.delete(config.API_URL+'/api/groups/'+groupId+'/leave', { headers:h })
    loadGroups()
    if (selectedChat?.id===groupId) setSelectedChat(null)
    showToast('已退出群聊', 'info')
  }

  const selectChat = async (chat, type) => {
    setSelectedChat({ ...chat, type })
    setUnread(prev => ({ ...prev, [chat.id]:0 }))
    setMessages([])
    if (type==='private') {
      try {
        const res = await axios.get(config.API_URL+'/api/friends/history/'+chat.id, { headers:h })
        setMessages(res.data.map(m => ({ from:m.sender_id, content:m.content, type:m.type, time:m.created_at })))
      } catch { setMessages([]) }
    } else {
      socket.emit('join_group', { groupId: chat.id })
      try {
        const res = await axios.get(config.API_URL+'/api/groups/'+chat.id+'/history', { headers:h })
        setMessages(res.data.map(m => ({ from:m.sender_id, username:m.username, content:m.content, type:m.type, time:m.created_at })))
      } catch { setMessages([]) }
    }
    requestAnimationFrame(() => messageInputRef.current?.focus())
  }

  const sendMessage = (content, type) => {
    if (!selectedChat || !content) return
    if (selectedChat.type === 'private') {
      const time = new Date().toISOString()
      setMessages(prev => [...prev, { from: String(user.id), content, type, time }])
      socket.emit('private_message', { to: selectedChat.id, content, type })
    } else {
      socket.emit('group_message', { groupId: selectedChat.id, content, type })
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return
    sendMessage(inputText.trim(), 'text')
    setInputText('')
    requestAnimationFrame(() => messageInputRef.current?.focus())
  }

  const handleLogout = () => {
    sessionStorage.removeItem('user'); sessionStorage.removeItem('token')
    socket.disconnect(); navigate('/')
  }

  const EMOJIS = ['😀','😂','🥰','😍','😭','😡','😎','🤔','👍','👎','❤️','🔥','🎉','💯','👋','🙏','😅','😤','🤣','😱','💪','🥳','😴','🤩']
  const totalUnread = Object.values(unread).reduce((a,b)=>a+b,0)

  /* ════════════════ RENDER ════════════════ */
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Toast 层：替代 alert()，完全在渲染进程内，不抢焦点 */}
      <Toast toasts={toasts} />

      {/* Confirm 层：替代 confirm()，完全在渲染进程内，不抢焦点 */}
      <ConfirmDialog dialog={confirmDialog} onConfirm={handleConfirmYes} onCancel={handleConfirmNo} />

      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ════════ Sidebar ════════ */}
        <div style={{ width:260, background:C.sidebar, display:'flex', flexDirection:'column', borderRight:`1px solid ${C.sidebarBorder}`, flexShrink:0 }}>

          {/* 用户信息头部 */}
          <div style={{ padding:'16px 14px 12px', borderBottom:`1px solid ${C.divider}`, display:'flex', alignItems:'center', gap:10 }}>
            <div
              onClick={() => navigate('/profile', { state:{ user, token } })}
              style={{ display:'flex', alignItems:'center', gap:10, flex:1, borderRadius:10, padding:'6px 8px', cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background=C.hover}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <Avatar name={user?.username||'?'} size={36} color={C.accent} />
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{user?.username}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>ID: {user?.id}</div>
              </div>
            </div>
            <button onClick={handleLogout} title="退出登录"
              style={{ width:32, height:32, borderRadius:8, background:'transparent', border:`1px solid ${C.inputBorder}`, color:C.textMuted, fontSize:14, transition:'all 0.15s', cursor:'pointer' }}
              onMouseEnter={e => { e.target.style.background='#fff0f0'; e.target.style.color=C.danger; e.target.style.borderColor=C.danger }}
              onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color=C.textMuted; e.target.style.borderColor=C.inputBorder }}
            >⎋</button>
          </div>

          {/* 搜索 */}
          <div style={{ padding:'10px 12px 4px' }}>
            <div style={{ display:'flex', gap:6 }}>
              <input ref={searchInputRef} placeholder="搜索用户..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchUsers()}
                style={{ flex:1, height:32, padding:'0 10px', borderRadius:8, border:`1px solid ${C.inputBorder}`, fontSize:13, color:C.text, background:C.bg, transition:'border 0.15s' }}
                onFocus={e=>e.target.style.borderColor=C.accent}
                onBlur={e=>e.target.style.borderColor=C.inputBorder}
              />
              <button onClick={searchUsers}
                style={{ padding:'0 12px', height:32, borderRadius:8, background:C.accent, color:'#fff', fontSize:12, fontWeight:600, border:'none', flexShrink:0, transition:'background 0.15s', cursor:'pointer' }}
                onMouseEnter={e=>e.target.style.background=C.accentHover}
                onMouseLeave={e=>e.target.style.background=C.accent}
              >搜索</button>
            </div>
            {searchResults.length>0 && (
              <div style={{ background:'#fff', border:`1px solid ${C.sidebarBorder}`, borderRadius:10, marginTop:6, overflow:'hidden', boxShadow:C.shadow }}>
                {searchResults.map(u => (
                  <div key={u.id} className="chat-item" style={{ display:'flex', alignItems:'center', padding:'8px 12px', gap:10 }}>
                    <Avatar name={u.username} size={28} />
                    <span style={{ flex:1, fontSize:13, color:C.text }}>{u.username}</span>
                    <button onClick={()=>addFriend(u.id)} style={{ padding:'3px 10px', borderRadius:6, background:C.accent, color:'#fff', fontSize:11, border:'none', fontWeight:600, cursor:'pointer' }}>添加</button>
                  </div>
                ))}
              </div>
            )}
            {searchQ && searchResults.length===0 && <div style={{ fontSize:12, color:C.textMuted, padding:'6px 4px' }}>未找到用户</div>}
          </div>

          {/* 好友申请 */}
          {pendingRequests.length>0 && (
            <div style={{ margin:'4px 12px 2px', background:'#fff8e1', borderRadius:10, padding:'8px 12px', border:'1px solid #ffe082' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.warning, marginBottom:6, letterSpacing:'0.05em' }}>好友申请</div>
              {pendingRequests.map(u => (
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                  <Avatar name={u.username} size={26} />
                  <span style={{ flex:1, fontSize:12, color:C.text }}>{u.username}</span>
                  <button onClick={()=>acceptFriend(u.id)} style={{ padding:'3px 10px', borderRadius:6, background:C.accent, color:'#fff', fontSize:11, border:'none', fontWeight:600, cursor:'pointer' }}>接受</button>
                </div>
              ))}
            </div>
          )}

          {/* 列表区 */}
          <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
            <SectionLabel>创建群组</SectionLabel>
            <SideInput inputRef={groupNameInputRef} placeholder="输入群名称..." value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onAction={createGroup} actionLabel="创建" />

            <SectionLabel>加入群组</SectionLabel>
            <SideInput inputRef={joinGroupInputRef} placeholder="输入群ID..." value={joinGroupId} onChange={e=>setJoinGroupId(e.target.value)} onAction={joinGroup} actionLabel="加入" />

            <SectionLabel>好友 {friends.length>0&&`(${friends.length})`}</SectionLabel>
            {friends.length===0 && <div style={{ fontSize:12, color:C.textMuted, padding:'2px 16px 8px' }}>暂无好友</div>}
            {friends.map(f => {
              const isActive = selectedChat?.id===f.id && selectedChat?.type==='private'
              return (
                <div key={f.id} className={`chat-item${isActive?' active':''}`}
                  style={{ display:'flex', alignItems:'center', padding:'8px 12px', gap:10, position:'relative' }}
                  onClick={()=>selectChat(f,'private')}
                >
                  <Avatar name={f.username} size={36} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:isActive?600:400, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.username}</div>
                  </div>
                  {unread[f.id]>0 && <div style={{ background:C.danger, color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:11, fontWeight:700, minWidth:18, textAlign:'center' }}>{unread[f.id]}</div>}
                  <button className="del-btn"
                    onClick={e=>{ e.stopPropagation(); deleteFriend(f.id) }}
                    style={{ width:22, height:22, borderRadius:'50%', background:'#fee', border:'none', color:C.danger, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}
                  >×</button>
                </div>
              )
            })}

            <SectionLabel>群聊 {groups.length>0&&`(${groups.length})`}</SectionLabel>
            {groups.length===0 && <div style={{ fontSize:12, color:C.textMuted, padding:'2px 16px 8px' }}>暂无群聊</div>}
            {groups.map(g => {
              const isActive = selectedChat?.id===g.id && selectedChat?.type==='group'
              return (
                <div key={g.id} className={`chat-item${isActive?' active':''}`}
                  style={{ display:'flex', alignItems:'center', padding:'8px 12px', gap:10, position:'relative' }}
                  onClick={()=>selectChat(g,'group')}
                >
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>👥</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:isActive?600:400, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>ID: {g.id}</div>
                  </div>
                  <button className="del-btn"
                    onClick={e=>{ e.stopPropagation(); leaveGroup(g.id) }}
                    style={{ width:22, height:22, borderRadius:'50%', background:'#fee', border:'none', color:C.danger, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}
                  >×</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ════════ Chat Main ════════ */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>
          {selectedChat ? (
            <>
              {/* 顶部栏 */}
              <div style={{ height:56, background:C.header, borderBottom:`1px solid ${C.divider}`, display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                {selectedChat.type==='group'
                  ? <div style={{ width:36, height:36, borderRadius:'50%', background:'#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👥</div>
                  : <Avatar name={selectedChat.username||selectedChat.name} size={36} />
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{selectedChat.username||selectedChat.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{selectedChat.type==='group'?'群聊':'好友'}</div>
                </div>
                {selectedChat.type==='group' && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>viewGroupMembers(selectedChat.id)}
                      style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:`1px solid ${C.inputBorder}`, fontSize:12, color:C.textMuted, cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>{ e.target.style.background=C.hover; e.target.style.color=C.text }}
                      onMouseLeave={e=>{ e.target.style.background='transparent'; e.target.style.color=C.textMuted }}
                    >成员</button>
                    <button onClick={()=>setShowInviteModal(true)}
                      style={{ padding:'6px 14px', borderRadius:8, background:C.accent, border:'none', fontSize:12, color:'#fff', cursor:'pointer', fontWeight:600, transition:'background 0.15s' }}
                      onMouseEnter={e=>e.target.style.background=C.accentHover}
                      onMouseLeave={e=>e.target.style.background=C.accent}
                    >邀请</button>
                  </div>
                )}
              </div>

              {/* 消息列表 */}
              <MessageArea messages={messages} currentUserId={user.id} chatType={selectedChat?.type} />

              {/* 输入区 */}
              <div style={{ background:C.header, borderTop:`1px solid ${C.divider}`, padding:'10px 16px 14px', flexShrink:0, position:'relative' }}>
                {showEmoji && (
                  <div ref={emojiRef} style={{ position:'absolute', bottom:'calc(100% + 6px)', left:16, background:'#fff', border:`1px solid ${C.sidebarBorder}`, borderRadius:14, padding:12, boxShadow:C.shadowStrong, display:'flex', flexWrap:'wrap', gap:4, width:248, zIndex:100 }}>
                    {EMOJIS.map(emoji => (
                      <span key={emoji}
                        onMouseDown={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setInputText(prev => prev + emoji)
                          setShowEmoji(false)
                          requestAnimationFrame(() => messageInputRef.current?.focus())
                        }}
                        style={{ fontSize:22, cursor:'pointer', padding:4, borderRadius:6, transition:'background 0.1s' }}
                        onMouseEnter={e=>e.target.style.background=C.bg}
                        onMouseLeave={e=>e.target.style.background='transparent'}
                      >{emoji}</span>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <button
                    onMouseDown={e=>{ e.preventDefault(); e.stopPropagation() }}
                    onClick={(e) => { e.stopPropagation(); setShowEmoji(v=>!v) }}
                    style={{ width:36, height:36, borderRadius:10, background:showEmoji?C.accentLight:C.bg, border:`1px solid ${showEmoji?C.accent:C.inputBorder}`, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
                  >😊</button>
                  <input
                    ref={messageInputRef}
                    value={inputText}
                    onChange={e=>setInputText(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSend()}
                    placeholder="输入消息，Enter 发送..."
                    autoFocus
                    style={{ flex:1, height:40, padding:'0 14px', borderRadius:10, border:`1px solid ${C.inputBorder}`, fontSize:14, color:C.text, background:C.bg, transition:'border 0.15s' }}
                    onFocus={e=>e.target.style.borderColor=C.accent}
                    onBlur={e=>e.target.style.borderColor=C.inputBorder}
                  />
                  <button
                    onMouseDown={e=>e.preventDefault()} // 关键：防止 input blur
                    onClick={handleSend}
                    style={{ height:40, padding:'0 20px', borderRadius:10, background:inputText.trim()?C.accent:C.inputBorder, color:inputText.trim()?'#fff':C.textMuted, fontSize:14, fontWeight:600, border:'none', cursor:inputText.trim()?'pointer':'default', transition:'all 0.2s', flexShrink:0 }}
                    onMouseEnter={e=>{ if(inputText.trim()) e.target.style.background=C.accentHover }}
                    onMouseLeave={e=>{ if(inputText.trim()) e.target.style.background=C.accent }}
                  >发送</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
              <div style={{ fontSize:56 }}>💬</div>
              <div style={{ fontSize:16, fontWeight:600, color:C.textMuted }}>选择好友或群聊开始对话</div>
              {totalUnread>0 && <div style={{ fontSize:13, color:C.danger }}>有 {totalUnread} 条未读消息</div>}
            </div>
          )}
        </div>
      </div>

      {/* 群信息弹窗 */}
      <Modal show={showGroupModal} onClose={()=>closeModal(setShowGroupModal)} title="群聊信息" width={320}>
        {groupInfo && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.divider}` }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👥</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{groupInfo.name}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>群ID: {groupInfo.id}</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>群成员 ({groupMembers.length})</div>
        <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {groupMembers.map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0' }}>
              <Avatar name={m.username} size={30} />
              <span style={{ fontSize:13, color:C.text }}>{m.username}</span>
              {m.id===user.id && <span style={{ fontSize:10, background:C.accentLight, color:C.accent, borderRadius:4, padding:'1px 6px', fontWeight:700 }}>我</span>}
            </div>
          ))}
        </div>
        <button onClick={()=>closeModal(setShowGroupModal)}
          style={{ width:'100%', marginTop:20, height:38, borderRadius:10, background:C.accent, color:'#fff', fontSize:14, fontWeight:600, border:'none', cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e=>e.target.style.background=C.accentHover}
          onMouseLeave={e=>e.target.style.background=C.accent}
        >关闭</button>
      </Modal>

      {/* 邀请好友弹窗 */}
      <Modal show={showInviteModal} onClose={()=>closeModal(setShowInviteModal)} title="邀请好友入群" width={300}>
        {friends.length===0
          ? <div style={{ color:C.textMuted, fontSize:13, textAlign:'center', padding:'20px 0' }}>暂无好友可邀请</div>
          : <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:260, overflowY:'auto' }}>
              {friends.map(f => (
                <div key={f.id} className="chat-item" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', borderRadius:8 }}>
                  <Avatar name={f.username} size={30} />
                  <span style={{ flex:1, fontSize:13, color:C.text }}>{f.username}</span>
                  <button onClick={()=>inviteFriend(f.id)} style={{ padding:'4px 12px', borderRadius:6, background:C.accent, color:'#fff', fontSize:12, border:'none', fontWeight:600, cursor:'pointer' }}>邀请</button>
                </div>
              ))}
            </div>
        }
        <button onClick={()=>closeModal(setShowInviteModal)}
          style={{ width:'100%', marginTop:16, height:36, borderRadius:10, background:C.hover, color:C.text, fontSize:13, fontWeight:600, border:`1px solid ${C.inputBorder}`, cursor:'pointer' }}
        >取消</button>
      </Modal>
    </>
  )
}

/* ─── Message Area ─── */
function MessageArea({ messages, currentUserId, chatType }) {
  const listRef = useRef(null)
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])
  const palette = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#9775fa','#f783ac','#63e6be']

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const str = timeStr.endsWith('Z') || timeStr.includes('+') ? timeStr : timeStr + 'Z'
    const d = new Date(str)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const hm = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    return isToday ? hm : `${d.getMonth()+1}/${d.getDate()} ${hm}`
  }

  return (
    <div ref={listRef} style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
      {messages.length===0 && <div style={{ textAlign:'center', color:C.textMuted, fontSize:13, marginTop:40 }}>暂无消息，开始聊天吧</div>}
      {messages.map((msg, i) => {
        const isMe = String(msg.from)===String(currentUserId)
        const avatarBg = palette[(String(msg.from).charCodeAt(0)||0)%palette.length]
        const showName = chatType==='group' && !isMe
        return (
          <div key={i} className="msg-bubble" style={{ display:'flex', flexDirection:'column', alignItems:isMe?'flex-end':'flex-start', gap:2 }}>
            {msg.time && <div style={{ fontSize:11, color:C.textMuted, paddingInline:36 }}>{formatTime(msg.time)}</div>}
            <div style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', gap:8, alignItems:'flex-start' }}>
              {!isMe && <div style={{ width:28, height:28, borderRadius:'50%', background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, flexShrink:0, marginTop:showName?0:4 }}>{String(msg.from).slice(0,1)}</div>}
              {isMe && <div style={{ width:28, height:28, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, flexShrink:0, marginTop:4 }}>{String(currentUserId).slice(0,1)}</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {showName && <div style={{ fontSize:12 }}><span style={{ color:avatarBg, fontWeight:600 }}>{msg.username}</span><span style={{ color:C.textMuted }}>({msg.from})</span></div>}
                <div style={{ maxWidth:400, padding:msg.type==='emoji'?'4px 8px':'8px 12px', borderRadius:isMe?'16px 4px 16px 16px':'4px 16px 16px 16px', background:isMe?C.bubbleSelf:C.bubble, color:C.text, fontSize:14, lineHeight:1.5, boxShadow:'0 1px 3px rgba(0,0,0,0.07)', wordBreak:'break-word' }}>
                  {msg.type==='emoji' ? <span style={{ fontSize:26, lineHeight:1 }}>{msg.content}</span> : msg.content}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
