import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TOPIC_BADGES = [
  { key: 'vermenigvuldigen', label: 'Vermenigvuldigen', icon: '✖️', color: '#7C3AED' },
  { key: 'optellen',         label: 'Optellen',         icon: '➕', color: '#2563EB' },
  { key: 'aftrekken',        label: 'Aftrekken',        icon: '➖', color: '#DB2777' },
  { key: 'delen',            label: 'Delen',            icon: '➗', color: '#D97706' },
  { key: 'breuken',          label: 'Breuken',          icon: '½',  color: '#059669' },
  { key: 'vraagstukken',     label: 'Vraagstukken',     icon: '📖', color: '#DC2626' },
]

function makeTopicBadges(topicKey, topicLabel) {
  return [
    {
      id: `${topicKey}_first`,
      icon: '🎉',
      name: `Eerste ${topicLabel}`,
      desc: `Eerste opgave ${topicLabel} gedaan`,
      fn: (t) => !!t,
    },
    {
      id: `${topicKey}_80`,
      icon: '🏅',
      name: `${topicLabel} topscore`,
      desc: `Gemiddeld ≥ 80% op ${topicLabel}`,
      fn: (t) => t && t.accuracy >= 80,
    },
    {
      id: `${topicKey}_95`,
      icon: '💯',
      name: `${topicLabel} meester`,
      desc: `Gemiddeld ≥ 95% op ${topicLabel}`,
      fn: (t) => t && t.accuracy >= 95,
    },
  ]
}

const GLOBAL_BADGES = [
  { id: 'g_1',   icon: '🎉', name: 'Eerste stap',     desc: 'Eerste opgave gedaan',            fn: (s) => s.total_problems >= 1 },
  { id: 'g_10',  icon: '⭐', name: '10 opgaven',      desc: '10 opgaven voltooid',              fn: (s) => s.total_problems >= 10 },
  { id: 'g_50',  icon: '🚀', name: '50 opgaven',      desc: '50 opgaven voltooid',              fn: (s) => s.total_problems >= 50 },
  { id: 'g_100', icon: '💎', name: '100 opgaven',     desc: '100 opgaven voltooid',             fn: (s) => s.total_problems >= 100 },
  { id: 'g_80',  icon: '🏆', name: 'Topscore',        desc: 'Gemiddeld ≥ 80% correct',          fn: (s) => s.correct_rate >= 80 },
  { id: 'g_90',  icon: '🌟', name: 'Uitblinker',      desc: 'Gemiddeld ≥ 90% correct',          fn: (s) => s.correct_rate >= 90 },
  { id: 'g_ms',  icon: '🌈', name: 'Veelzijdig',      desc: 'In 3+ onderwerpen geoefend',       fn: (s) => s.by_topic.length >= 3 },
  { id: 'g_all', icon: '📚', name: 'Alles geprobeerd', desc: 'In 5+ onderwerpen geoefend',      fn: (s) => s.by_topic.length >= 5 },
]

const STREAK_BADGES = [
  { id: 's_2', icon: '🔥', name: '2 dagen op rij',  desc: '2 dagen achter elkaar geoefend', fn: (s) => s.streak_days >= 2 },
  { id: 's_3', icon: '🌋', name: '3 dagen reeks',   desc: '3 dagen op rij geoefend',         fn: (s) => s.streak_days >= 3 },
  { id: 's_5', icon: '⚡', name: '5 dagen reeks',   desc: '5 dagen op rij geoefend',         fn: (s) => s.streak_days >= 5 },
  { id: 's_7', icon: '🏆', name: 'Week kampioen',   desc: '7 dagen op rij — ongelooflijk!',  fn: (s) => s.streak_days >= 7 },
]

export default function Badges() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Kon badges niet laden.'))
  }, [])

  if (error) return <div style={s.page}><p style={{ color: 'var(--wrong)' }}>{error}</p></div>
  if (!stats) return <div style={s.page}><span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Laden...</span></div>

  const topicMap = {}
  stats.by_topic.forEach(t => { topicMap[t.topic] = t })

  // Collect all badges and check which are earned
  const allTopicBadges = TOPIC_BADGES.flatMap(t => makeTopicBadges(t.key, t.label))
  const allBadges = [...GLOBAL_BADGES, ...STREAK_BADGES, ...allTopicBadges]
  const earnedCount = allBadges.filter(b => {
    if (GLOBAL_BADGES.includes(b) || STREAK_BADGES.includes(b)) return b.fn(stats)
    // topic badge
    const topicKey = b.id.split('_')[0]
    return b.fn(topicMap[topicKey])
  }).length

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoBox}>🏆</div>
          <div>
            <div style={s.title}>Mijn Beloningen</div>
            <div style={s.sub}>Verdien badges door te oefenen! 🌟</div>
          </div>
        </div>
        <button style={s.backBtn} onClick={() => navigate('/')}>← Terug</button>
      </header>

      {/* Hero progress */}
      <div style={s.hero}>
        <div>
          <div style={s.heroTitle}>🎉 Jouw badges</div>
          <div style={s.heroSub}>
            {earnedCount === 0
              ? 'Maak je eerste oefening om badges te verdienen!'
              : earnedCount >= allBadges.length
              ? 'Je hebt alle badges! Ongelooflijk! 🎉'
              : `Blijf oefenen om meer badges te verdienen! 💪`}
          </div>
        </div>
        <div style={s.heroStats}>
          <div style={s.heroCnt}>
            <span style={s.heroCntVal}>{earnedCount}</span>
            <span style={s.heroCntLabel}>verdiend</span>
          </div>
          <div style={s.heroCnt}>
            <span style={s.heroCntVal}>{allBadges.length}</span>
            <span style={s.heroCntLabel}>totaal</span>
          </div>
          <div style={s.heroCnt}>
            <span style={{ ...s.heroCntVal, color: '#D97706' }}>
              {Math.round(earnedCount / allBadges.length * 100)}%
            </span>
            <span style={s.heroCntLabel}>verzameld</span>
          </div>
        </div>
      </div>

      {/* Per-topic sections */}
      {TOPIC_BADGES.map(t => {
        const badges = makeTopicBadges(t.key, t.label)
        const ts = topicMap[t.key]
        const earned = badges.filter(b => b.fn(ts)).length
        return (
          <div key={t.key} style={s.section}>
            <div style={{ ...s.sectionHead, color: t.color }}>
              <span style={s.sectionIcon}>{t.icon}</span>
              {t.label}
              <span style={{ ...s.sectionPct, color: t.color }}>
                {earned}/{badges.length}
              </span>
            </div>
            <div style={s.badgeGrid}>
              {badges.map(b => (
                <BadgeCard key={b.id} badge={b} earned={b.fn(ts)} accentColor={t.color} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Global milestones */}
      <div style={s.section}>
        <div style={{ ...s.sectionHead, color: '#5B21B6' }}>
          <span style={s.sectionIcon}>🚀</span>
          Mijlpalen
        </div>
        <div style={s.badgeGrid}>
          {GLOBAL_BADGES.map(b => (
            <BadgeCard key={b.id} badge={b} earned={b.fn(stats)} accentColor="#5B21B6" />
          ))}
        </div>
      </div>

      {/* Streak badges */}
      <div style={s.section}>
        <div style={{ ...s.sectionHead, color: '#D97706' }}>
          <span style={s.sectionIcon}>🔥</span>
          Reeksen
        </div>
        <div style={s.badgeGrid}>
          {STREAK_BADGES.map(b => (
            <BadgeCard key={b.id} badge={b} earned={b.fn(stats)} accentColor="#D97706" />
          ))}
        </div>
      </div>
    </div>
  )
}

function BadgeCard({ badge, earned, accentColor }) {
  return (
    <div style={{
      ...s.badge,
      ...(earned ? { ...s.badgeEarned, borderColor: accentColor } : s.badgeLocked),
    }}>
      <span style={{ ...s.badgeIcon, filter: earned ? 'none' : 'grayscale(1)' }}>
        {badge.icon}
      </span>
      <div style={{ ...s.badgeName, color: earned ? accentColor : 'var(--text)' }}>
        {badge.name}
      </div>
      <div style={s.badgeDesc}>{badge.desc}</div>
      {earned
        ? <span style={{ ...s.badgeTag, background: accentColor }}>✓ Verdiend!</span>
        : <span style={s.badgeTagLocked}>🔒 Nog niet</span>
      }
    </div>
  )
}

const s = {
  page: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '20px 20px 64px',
    fontFamily: 'var(--font-body)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px',
    boxShadow: '0 3px 10px rgba(217,119,6,0.35)',
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--text)' },
  sub: { fontSize: '12px', color: 'var(--muted)', marginTop: '2px' },
  backBtn: {
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

  hero: {
    background: 'linear-gradient(135deg, #FFFBEB, #FEF9E7)',
    border: '2px solid #FDE68A',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    boxShadow: '0 4px 20px rgba(251,191,36,0.15)',
  },
  heroTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#92400E', marginBottom: '4px' },
  heroSub: { fontSize: '13px', color: '#B45309', fontWeight: 600 },
  heroStats: { display: 'flex', gap: '24px' },
  heroCnt: { textAlign: 'center' },
  heroCntVal: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', color: '#D97706', display: 'block', lineHeight: 1 },
  heroCntLabel: { fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.07em' },

  section: { marginBottom: '28px' },
  sectionHead: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
    paddingBottom: '8px',
    borderBottom: '2px solid var(--border)',
  },
  sectionIcon: { fontSize: '20px' },
  sectionPct: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: 700,
    marginLeft: 'auto',
    opacity: 0.7,
  },

  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  badge: {
    background: 'var(--surface)',
    border: '2px solid',
    borderRadius: '14px',
    padding: '16px 12px',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  badgeEarned: {
    boxShadow: '0 4px 16px rgba(91,33,182,0.15)',
  },
  badgeLocked: {
    borderColor: 'var(--border)',
    opacity: 0.5,
  },
  badgeIcon: { fontSize: '34px', lineHeight: 1, marginBottom: '2px' },
  badgeName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', lineHeight: 1.2 },
  badgeDesc: { fontSize: '11px', color: 'var(--muted)', fontWeight: 500, lineHeight: 1.4 },
  badgeTag: {
    display: 'inline-block',
    marginTop: '4px',
    color: '#fff',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '9999px',
  },
  badgeTagLocked: {
    display: 'inline-block',
    marginTop: '4px',
    background: 'var(--bg)',
    color: 'var(--muted)',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '9999px',
    border: '1px solid var(--border)',
  },
}
