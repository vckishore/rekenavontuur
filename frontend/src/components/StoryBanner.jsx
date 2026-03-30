export default function StoryBanner({ story }) {
  if (!story) return null
  return (
    <div style={styles.banner}>
      <span style={styles.icon}>✨</span>
      {story}
    </div>
  )
}

const styles = {
  banner: {
    background: 'var(--primary-grad)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontStyle: 'italic',
    color: '#EDE9FE',
    lineHeight: 1.55,
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  icon: {
    fontStyle: 'normal',
    flexShrink: 0,
    marginTop: '1px',
  },
}
