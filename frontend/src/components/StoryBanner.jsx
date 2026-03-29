export default function StoryBanner({ story }) {
  if (!story) return null
  return (
    <div style={{
      border: '1px dashed #aaa',
      padding: '12px',
      marginBottom: '16px',
      fontSize: '13px',
      lineHeight: 1.5,
      background: '#fafaf8',
    }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#888',
        display: 'block',
        marginBottom: '6px',
      }}>
        [ VERHAALTJE ]
      </span>
      {story}
    </div>
  )
}
