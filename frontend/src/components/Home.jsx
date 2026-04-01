import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TOPICS = [
  { key: 'vermenigvuldigen', label: 'Vermenigvuldigen', icon: '✖️', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'optellen',         label: 'Optellen',         icon: '➕', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'aftrekken',        label: 'Aftrekken',        icon: '➖', color: '#DB2777', bg: '#FCE7F3' },
  { key: 'delen',            label: 'Delen',            icon: '➗', color: '#D97706', bg: '#FEF3C7' },
  { key: 'breuken',          label: 'Breuken',          icon: '½',  color: '#059669', bg: '#D1FAE5' },
  { key: 'vraagstukken',     label: 'Vraagstukken',     icon: '📖', color: '#DC2626', bg: '#FEE2E2' },
]

export default function Home() {
  const [grade, setGrade] = useState(3)
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const topicMap = {}
  if (stats) {
    stats.by_topic.forEach(t => { topicMap[t.topic] = t })
  }

  function startPractice(topicKey) {
    navigate(`/practice?topic=${topicKey}&grade=${grade}`)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoBox}>🧮</div>
          <div>
            <div style={s.appTitle}>Rekenavontuur</div>
            <div style={s.appSub}>Kies een onderwerp en begin!</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <button style={s.navBtn} onClick={() => navigate('/dashboard')}>📊 Voortgang</button>
          <button style={s.navBtnGold} onClick={() => navigate('/badges')}>🏆 Badges</button>
        </div>
      </header>

      {/* Stats strip */}
      {stats && stats.total_problems > 0 && (
        <div style={s.statsStrip}>
          <StatChip icon="🎯" value={stats.total_problems} label="opgaven" color="#7C3AED" />
          <StatChip icon="✅" value={`${stats.correct_rate}%`} label="juist" color="#059669" />
          <StatChip icon="📚" value={stats.total_sessions} label="sessies" color="#2563EB" />
          <StatChip icon="🔥" value={stats.streak_days} label="dagen op rij" color="#D97706" />
        </div>
      )}

      {/* Grade picker */}
      <div style={s.gradeSection}>
        <div style={s.sectionLabel}>Leerjaar</div>
        <div style={s.gradePills}>
          {[1, 2, 3, 4, 5, 6].map(g => (
            <button
              key={g}
              style={{ ...s.gradePill, ...(grade === g ? s.gradePillActive : {}) }}
              onClick={() => setGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Topic cards */}
      <div style={s.sectionLabel} id="topics-label">Kies een onderwerp</div>
      <div style={s.topicGrid}>
        {TOPICS.map(t => {
          const ts = topicMap[t.key]
          return (
            <TopicCard
              key={t.key}
              topic={t}
              stats={ts}
              onStart={() => startPractice(t.key)}
            />
          )
        })}
      </div>
    </div>
  )
}

function TopicCard({ topic, stats, onStart }) {
  const [hovered, setHovered] = useState(false)
  const hasStats = !!stats

  return (
    <div
      style={{
        ...s.topicCard,
        borderColor: hovered ? topic.color : 'var(--border)',
        boxShadow: hovered
          ? `0 8px 28px ${topic.color}30`
          : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...s.topicIconWrap, background: topic.bg }}>
        <span style={s.topicIcon}>{topic.icon}</span>
      </div>

      <div style={s.topicName}>{topic.label}</div>

      {hasStats ? (
        <div style={s.topicStatsRow}>
          <AccBar pct={stats.accuracy} color={topic.color} />
          <span style={{ ...s.topicPct, color: topic.color }}>{stats.accuracy}%</span>
        </div>
      ) : (
        <div style={s.topicNew}>Nog niet geprobeerd</div>
      )}

      <button
        style={{ ...s.startBtn, background: topic.color }}
        onClick={onStart}
      >
        Oefenen →
      </button>
    </div>
  )
}

function AccBar({ pct, color }) {
  return (
    <div style={s.accBarBg}>
      <div style={{ ...s.accBarFill, width: `${pct}%`, background: color }} />
    </div>
  )
}

function StatChip({ icon, value, label, color }) {
  return (
    <div style={s.statChip}>
      <span style={s.statChipIcon}>{icon}</span>
      <span style={{ ...s.statChipVal, color }}>{value}</span>
      <span style={s.statChipLabel}>{label}</span>
    </div>
  )
}

const s = {
  page: {
    maxWidth: '900px',
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
  appTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '24px',
    color: 'var(--text)',
    lineHeight: 1.1,
  },
  appSub: { fontSize: '12px', color: 'var(--muted)', marginTop: '2px' },
  headerRight: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
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
    transition: 'all 0.15s',
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
    boxShadow: '0 3px 10px rgba(217,119,6,0.35)',
    transition: 'all 0.15s',
  },

  statsStrip: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  statChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: '50px',
    padding: '7px 14px',
    boxShadow: 'var(--shadow-sm)',
  },
  statChipIcon: { fontSize: '14px' },
  statChipVal: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '17px',
    lineHeight: 1,
  },
  statChipLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--muted)' },

  gradeSection: { marginBottom: '24px' },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '10px',
  },
  gradePills: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  gradePill: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '2px solid var(--border)',
    background: 'var(--surface)',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '16px',
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  gradePillActive: {
    background: 'var(--primary-grad)',
    borderColor: 'var(--primary-mid)',
    color: '#fff',
    boxShadow: 'var(--shadow-btn)',
  },

  topicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '10px',
  },
  topicCard: {
    background: 'var(--surface)',
    border: '2px solid',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.18s',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  topicIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIcon: { fontSize: '28px', lineHeight: 1 },
  topicName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '18px',
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  topicStatsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  topicPct: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 700,
    minWidth: '36px',
    textAlign: 'right',
  },
  topicNew: {
    fontSize: '12px',
    color: 'var(--muted)',
    fontStyle: 'italic',
  },
  accBarBg: {
    flex: 1,
    height: '8px',
    background: 'var(--primary-tint)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  accBarFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.6s ease',
  },
  startBtn: {
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    height: '44px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'filter 0.15s, transform 0.15s',
  },
}
