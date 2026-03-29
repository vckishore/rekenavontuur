export default function ProgressDots({ total = 5, completed = 0 }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '16px' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
        progress:
      </span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          data-testid={i < completed ? 'dot-filled' : 'dot-empty'}
          style={{
            width: '16px',
            height: '16px',
            border: '1px solid #333',
            borderRadius: '50%',
            display: 'inline-block',
            background: i < completed ? '#333' : 'transparent',
          }}
        />
      ))}
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', marginLeft: '4px' }}>
        {completed} / {total}
      </span>
    </div>
  )
}
