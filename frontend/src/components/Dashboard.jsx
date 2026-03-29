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

  if (error) return <div style={styles.screen}><p style={{ color: '#c00' }}>{error}</p></div>
  if (!data) return <div style={styles.screen}>Laden...</div>

  return (
    <div style={styles.screen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={styles.h1}>Overzicht voor ouders</h1>
        <button style={styles.btn} onClick={() => navigate('/')}>← Oefenen</button>
      </div>

      <div style={styles.statRow}>
        <StatBox number={data.total_problems} label="opgaven gemaakt" />
        <StatBox number={`${data.correct_rate}%`} label="correct" />
        <StatBox number={data.total_sessions} label="sessies" />
      </div>

      {data.by_topic.length === 0 ? (
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#888' }}>
          Nog geen sessies. Maak een oefenronde om hier statistieken te zien.
        </p>
      ) : (
        <>
          <div style={styles.label}>per onderwerp</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Onderwerp</th>
                <th style={styles.th}>Geprobeerd</th>
                <th style={styles.th}>Correct</th>
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
          Opgelet: de opgavenbank is bijna leeg. Codex genereert automatisch nieuwe opgaven.
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <a href="/api/export/csv" download style={styles.btnPrimary}>Exporteer CSV</a>
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
