const EMOJIS = [
  '😀','😂','🥰','😍','😭','😡','😎','🤔',
  '👍','👎','❤️','🔥','🎉','💯','👋','🙏',
  '😅','😤','🤣','😱','💪','🥳','😴','🤩'
]

export default function EmojiPicker({ onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, background: '#fff', border: '1px solid #ddd', maxWidth: 200 }}>
      {EMOJIS.map(emoji => (
        <span key={emoji} onClick={() => onSelect(emoji)} style={{ fontSize: 22, cursor: 'pointer', padding: 4 }}>{emoji}</span>
      ))}
    </div>
  )
}