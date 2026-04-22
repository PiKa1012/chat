import { useState, useRef, useEffect } from 'react'

export default function InputBox({ onSend }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim(), 'text')
    setText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div style={{ display: 'flex', padding: 10 }}>
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="输入消息..."
        style={{ flex: 1, padding: 10, marginLeft: 40 }}
      />
      <div role="button" tabIndex={0} onClick={() => handleSend()} onKeyDown={(e) => e.key === 'Enter' && handleSend()} style={{ padding: '10px 20px', marginLeft: 10, cursor: 'pointer', background: '#4CAF50', color: '#fff', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>发送</div>
    </div>
  )
}