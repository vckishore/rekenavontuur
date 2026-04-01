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
    <div style={s.page}>
      <p style={{ color: 'var(--wrong)', fontWeight: 600 }}>{error}</p>
    </div>
  )
  if (!data) return (
    <div style={s.page}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)' }}>Laden...</span>
    </div>
  )

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoBox}>📊</div>
          <div>
            <div style={s.title}>Voortgang</div>
            <div style={s.sub}>Overzicht van alle sessies</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <button style={s.navBtn} onClick={() => navigate('/')}>← Terug</button>
          <button style={s.navBtnGold} onClick={() => navigate('/badges')}>🏆 Badges</button>
        </div>
      </header>

      {/* Stats row */}
      <div style={s.statsRow}>
        <StatBox icon="🎯" value={data.total_problems} label="opgaven" color="#7C3AED" stripe="var(--primary-grad)" />
        <StatBox icon="✅" value={`${data.correct_rate}%`} label="juist" color="#059669" stripe="linear-gradient(90deg,#4ADE80,#059669)" />
        <StatBox icon="📚" value={data.total_sessions} label="sessies" color="#2563EB" stripe="linear-gradient(90deg,#60A5FA,#2563EB)" />
        <StatBox icon="🔥" value={data.streak_days} label="dagen op rij" color="#D97706" stripe="linear-gradient(90deg,#FCD34D,#D97706)" />
      </div>

      {/* Topic breakdown */}
      {data.by_topic.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📝</div>
          <p>Nog geen sessies. Ga oefenen om statistieken te zien!</p>
          <button style={s.btnPrimary} onClick={() => navigate('/')}>Begin met oefenen</button>
        </div>
      ) : (
        <div style={s.card}>
          <div style={s.cardTitle}>
            <span style={s.cardDot} />
            Nauwkeurigheid per onderwerp
          </div>
          {data.by_topic.map(t => <TopicRow key={t.topic} topic={t} />)}
        </div>
      )}

      {data.low_pool_warning && (
        <div style={s.warning}>
          Opgelet: de opgavenbank is bijna leeg. Codex genereert automatisch nieuwe opgaven.
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <a href="/api/export/csv" download style={s.exportBtn}>↓ Exporteer CSV</a>
      </div>
    </div>
  )
}

function StatBox({ icon, value, label, color, stripe }) {
  return (
    <div style={s.statBox}>
      <div style={{ ...s.statStripe, background: stripe }} />
      <div style={s.statIcon}>{icon}</div>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
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
    <div style={s.topicRow}>
      <div style={s.topicName}>{topic.topic}</div>
      <div style={s.barBg}>
        <div style={{ ...s.barFill, width: `${pct}%`, background: barColor }} />
      </div>
      <div style={s.barPct}>{pct}%</div>
      <div style={s.topicCount}>{topic.attempted}×</div>
    </div>
  )
}

const s = {
  page: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px 20px 60px',
    fontFamily: 'var(--font-body)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    padding: '14px 20px',
    marginBottom: '20px',
    boxShadow: 'var(--shadow-sm)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  logoBox: {
    width: '48px', height: '48px',
    background: 'var(--primary-grad)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px',
    boxShadow: 'var(--shadow-btn)',
    flexShrink: 0,
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--text)' },
  sub: { fontSize: '12px', color: 'var(--muted)', marginTop: '2px' },
  headerRight: { display: 'flex', gap: '8px' },
  navBtn: {
    background: 'var(--surface)',
    color: 'var(--primary-mid)',
    border: '2px solid var(--border)',
    borderRadius: '50px',
    padding: '8px 16px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  navBtnGold: {
    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '8px 16px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(217,119,6,0.3)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '14px',
    padding: '16px 12px 14px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
    position: 'relative',
    overflow: 'hidden',
  },
  statStripe: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '4px',
    borderRadius: '4px 4px 0 0',
  },
  statIcon: { fontSize: '20px', marginBottom: '6px', marginTop: '4px' },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '28px',
    lineHeight: 1,
    marginBottom: '4px',
  },
  statLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--muted)' },

  card: {
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '16px',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text)',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardDot: {
    width: '10px', height: '10px',
    borderRadius: '50%',
    background: 'var(--primary-mid)',
    display: 'inline-block',
    flexShrink: 0,
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
  topicCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--muted)',
    minWidth: '24px',
    textAlign: 'right',
  },
  empty: {
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    padding: '40px 24px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '16px',
  },
  emptyIcon: { fontSize: '42px', marginBottom: '12px' },
  btnPrimary: {
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
    marginTop: '16px',
    boxShadow: 'var(--shadow-btn)',
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
    marginTop: '8px',
  },
  exportBtn: {
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
