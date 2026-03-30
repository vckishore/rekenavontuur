export default function ProgressDots({ total = 5, completed = 0 }) {
  return (
    <div style={styles.row}>
      <div style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            data-testid={i < completed ? 'dot-filled' : 'dot-empty'}
            style={{
              ...styles.dot,
              background: i < completed ? 'var(--primary-mid)' : 'var(--primary-tint)',
              borderColor: i < completed ? 'var(--primary-mid)' : 'var(--border-strong)',
            }}
          />
        ))}
      </div>
      <span style={styles.label}>{completed}/{total}</span>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },
  dots: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'inline-block',
    transition: 'background 0.15s, border-color 0.15s',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    marginLeft: 'auto',
  },
}
