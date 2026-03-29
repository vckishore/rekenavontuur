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
      .catch(() => setError('Could not load dashboard.'))
  }, [])

  if (error) return <div style={styles.screen}><p style={{ color: '#c00' }}>{error}</p></div>
  if (!data) return <div style={styles.screen}>Loading...</div>

  return (
    <div style={styles.screen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={styles.h1}>Parent Dashboard</h1>
        <button style={styles.btn} onClick={() => navigate('/')}>← Practice</button>
      </div>

      <div style={styles.statRow}>
        <StatBox number={data.total_problems} label="problems solved" />
        <StatBox number={`${data.correct_rate}%`} label="correct rate" />
        <StatBox number={data.total_sessions} label="sessions" />
      </div>

      {data.by_topic.length === 0 ? (
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#888' }}>
          No sessions yet. Play a round to see stats here.
        </p>
      ) : (
        <>
          <div style={styles.label}>by topic</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Topic</th>
                <th style={styles.th}>Attempted</th>
                <th style={styles.th}>Accuracy</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {data.by_topic.map(t => (
                <tr key={t.topic}>
                  <td style={styles.td}>{t.topic}</td>
                  <td style={styles.td}>{t.attempted}</td>
                  <td style={styles.td}>{t.accuracy}%</td>
                  <td style={styles.td}>
                    <div style={styles.miniBarWrap}>
                      <div style={{ ...styles.miniBarFill, width: `${t.accuracy}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {data.low_pool_warning && (
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a60', marginBottom: '12px' }}>
          Warning: problem pool is running low. Codex will regenerate automatically.
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <a href="/api/export/csv" download style={styles.btnPrimary}>Export CSV</a>
      </div>
    </div>
  )
}

function StatBox({ number, label }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statNumber}>{number}</span>
      <span style={styles.statDesc}>{label}</span>
    </div>
  )
}

const styles = {
  screen: {
    maxWidth: '560px',
    margin: '40px auto',
    padding: '24px',
    fontFamily: 'Georgia, serif',
  },
  h1: {
    fontFamily: 'monospace',
    fontSize: '14px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    margin: 0,
  },
  statRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    border: '1px solid #bbb',
    padding: '12px',
    flex: 1,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '28px',
    fontFamily: 'monospace',
    display: 'block',
  },
  statDesc: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#888',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    marginBottom: '16px',
  },
  th: {
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#888',
    borderBottom: '1px solid #ccc',
    padding: '4px 8px',
  },
  td: {
    padding: '6px 8px',
    borderBottom: '1px dashed #e0e0e0',
  },
  miniBarWrap: {
    background: '#f0f0f0',
    height: '8px',
    width: '80px',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  miniBarFill: {
    background: '#555',
    height: '100%',
  },
  btn: {
    border: '2px solid #333',
    background: '#fff',
    padding: '8px 16px',
    minHeight: '44px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    textDecoration: 'none',
    color: '#333',
  },
  btnPrimary: {
    border: '2px solid #333',
    background: '#333',
    color: '#fff',
    padding: '8px 16px',
    minHeight: '44px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
}
