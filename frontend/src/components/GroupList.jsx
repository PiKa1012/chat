export default function GroupList({ groups, onSelect, onLeave }) {
  return (
    <div style={{ marginTop: 10 }}>
      <h4>群组</h4>
      {groups.length === 0 && <p style={{ color: '#999', fontSize: 12 }}>暂无群组</p>}
      {groups.map(g => (
        <div key={g.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
          <div onClick={() => onSelect(g)} style={{ flex: 1, cursor: 'pointer' }}>
            <span>👥 {g.name}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onLeave(g.id) }} style={{ fontSize: 10, color: 'red', background: 'none', border: 'none' }}>✕</button>
        </div>
      ))}
    </div>
  )
}