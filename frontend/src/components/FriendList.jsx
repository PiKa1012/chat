export default function FriendList({ friends, unread, onSelect, onDelete }) {
  return (
    <div>
      <h4>好友</h4>
      {friends.length === 0 && <p style={{ color: '#999', fontSize: 12 }}>暂无好友</p>}
      {friends.map(f => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
          <div onClick={() => onSelect(f)} style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
            <span>👤 {f.username}</span>
            {unread[f.id] > 0 && <span style={{ position: 'absolute', right: 5, background: 'red', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 10 }}>{unread[f.id]}</span>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(f.id) }} style={{ fontSize: 10, color: 'red', background: 'none', border: 'none' }}>✕</button>
        </div>
      ))}
    </div>
  )
}