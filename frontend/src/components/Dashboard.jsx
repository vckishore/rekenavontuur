import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(() => setError('Kon het dashboard niet laden.'))
  }, [])

  if (error) return (
    <div style={styles.screen}>
      <p style={{ color: 'var(--wrong)', fontWeight: 600 }}>{error}</p>
    </div>
  )
  if (!data) return (
    <div style={styles.screen}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)' }}>
        Laden...
      </span>
    </div>
  )

  return (
    <div style={styles.screen}>
      <div style={styles.topRow}>
        <h1 style={styles.h1}>Voortgang</h1>
        <button style={styles.btnGhost} onClick={() => navigate('/')}>← Oefenen</button>
      </div>

      <div style={styles.statRow}>
        <StatBox number={data.total_problems} label="opgaven" />
        <StatBox number={`${data.correct_rate}%`} label="juist" highlight />
        <StatBox number={data.total_sessions} label="sessies" />
      </div>

      {data.by_topic.length === 0 ? (
        <p style={styles.emptyMsg}>
          Nog geen sessies. Maak een oefenronde om hier statistieken te zien.
        </p>
      ) : (
        <>
          <div style={styles.sectionLabel}>Nauwkeurigheid per onderwerp</div>
          {data.by_topic.map(t => (
            <TopicRow key={t.topic} topic={t} />
          ))}
        </>
      )}

      {data.low_pool_warning && (
        <div style={styles.warning}>
          Opgelet: de opgavenbank is bijna leeg. Codex genereert automatisch nieuwe opgaven.
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <a href="/api/export/csv" download style={styles.btnExport}>
          ↓ Exporteer CSV
        </a>
      </div>
    </div>
  )
}

function StatBox({ number, label, highlight }) {
  return (
    <div style={styles.statBox}>
      <span style={{
        ...styles.statNumber,
        ...(highlight ? styles.statNumberHighlight : {}),
      }}>
        {number}
      </span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function TopicRow({ topic }) {
  const pct = topic.accuracy
  const barColor = pct >= 80
    ? 'linear-gradient(90deg, #059669, #10B981)'
    : pct >= 60
    ? 'var(--primary-grad)'
    : 'linear-gradient(90deg, #DC2626, #EF4444)'

  return (
    <div style={styles.topicRow}>
      <div style={styles.topicName}>{topic.topic}</div>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: barColor }} />
      </div>
      <div style={styles.barPct}>{pct}%</div>
    </div>
  )
}

const styles = {
  screen: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '24px',
    fontFamily: 'var(--font-body)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '24px',
    color: 'var(--text)',
  },
  btnGhost: {
    background: 'var(--surface)',
    color: 'var(--primary-mid)',
    border: '2px solid var(--border)',
    borderRadius: '8px',
    height: '40px',
    padding: '0 16px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '28px',
  },
  statBox: {
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '14px',
    padding: '16px 12px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  statNumber: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '32px',
    lineHeight: 1,
    display: 'block',
    marginBottom: '4px',
    color: 'var(--primary-mid)',
  },
  statNumberHighlight: {
    color: 'var(--correct)',
  },
  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--muted)',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '12px',
  },
  topicRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  topicName: {
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text)',
    minWidth: '140px',
    textTransform: 'capitalize',
  },
  barBg: {
    flex: 1,
    height: '10px',
    background: 'var(--primary-tint)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.6s ease',
  },
  barPct: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text)',
    minWidth: '36px',
    textAlign: 'right',
  },
  emptyMsg: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--muted)',
  },
  warning: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    color: '#92400E',
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '8px',
    padding: '10px 14px',
    marginTop: '16px',
  },
  btnExport: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--primary-grad)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    height: '44px',
    padding: '0 20px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-btn)',
  },
}
