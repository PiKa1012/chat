import { useRef, useEffect } from 'react'

export default function MessageList({ messages, currentUserId }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
      {messages.map((msg, i) => {
        const isMe = String(msg.from) === String(currentUserId)
        return (
          <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
            <div style={{
              maxWidth: '70%',
              padding: '8px 12px',
              borderRadius: 8,
              background: isMe ? '#4CAF50' : '#f1f1f1',
              color: isMe ? '#fff' : '#000'
            }}>
              {msg.type === 'emoji' ? <span style={{ fontSize: 32 }}>{msg.content}</span> : msg.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}