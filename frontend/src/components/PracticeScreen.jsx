import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StoryBanner from './StoryBanner.jsx'
import ProgressDots from './ProgressDots.jsx'

export default function PracticeScreen() {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic') || 'vermenigvuldigen'
  const grade = parseInt(searchParams.get('grade') || '3', 10)

  const [sessionId, setSessionId] = useState(null)
  const [problems, setProblems] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [completed, setCompleted] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cardState, setCardState] = useState(null)
  const attemptRef = useRef(1)
  const navigate = useNavigate()

  useEffect(() => {
    startSession()
  }, [])

  async function startSession() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade, count: 5 }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Kon de opgaven niet laden. Probeer het later opnieuw.')
        return
      }
      const data = await res.json()
      setSessionId(data.session_id)
      setProblems(data.problems)
      setCurrent(0)
      setCompleted(0)
      setDone(false)
      setFeedback(null)
      setAnswer('')
      setCardState(null)
      attemptRef.current = 1
    } catch {
      setError('Kon geen verbinding maken met de server.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !problems[current] || submitting) return
    const problem = problems[current]
    setSubmitting(true)
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          problem_id: problem.id,
          topic: problem.topic,
          grade: problem.grade,
          user_answer: answer.trim(),
          attempt_number: attemptRef.current,
        }),
      })
      if (!res.ok) {
        setFeedback({ type: 'error', message: 'Er ging iets mis. Probeer het opnieuw.' })
        return
      }
      const data = await res.json()

      if (data.error) {
        setFeedback({ type: 'error', message: data.error })
        return
      }

      if (data.correct) {
        const next = completed + 1
        setCompleted(next)
        setCardState('correct')
        setFeedback({ type: 'correct', message: 'Juist! Goed gedaan!' })
        attemptRef.current = 1
        if (next >= problems.length) {
          setTimeout(() => setDone(true), 900)
        } else {
          setTimeout(() => {
            setCurrent(c => c + 1)
            setAnswer('')
            setFeedback(null)
            setCardState(null)
          }, 900)
        }
      } else {
        attemptRef.current += 1
        setCardState('wrong')
        setFeedback({ type: 'wrong', message: 'Niet helemaal.', hint: data.hint })
        setTimeout(() => setCardState(null), 400)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Er ging iets mis. Probeer het opnieuw.' })
    } finally {
      setSubmitting(false)
    }
  }

  function skipProblem() {
    if (problems.length === 0) return
    const updated = [...problems]
    const [skipped] = updated.splice(current, 1)
    updated.push(skipped)
    setProblems(updated)
    if (current >= updated.length) setCurrent(updated.length - 1)
    setAnswer('')
    setFeedback(null)
    setCardState(null)
    attemptRef.current = 1
  }

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.loadingText}>Opgaven laden...</div>
    </div>
  )

  if (error) return (
    <div style={styles.center}>
      <p style={styles.errorMsg}>{error}</p>
      <button style={styles.btnPrimary} onClick={startSession}>Opnieuw proberen</button>
    </div>
  )

  if (done) return (
    <DoneScreen
      onRetry={startSession}
      onHome={() => navigate('/')}
      onDashboard={() => navigate('/dashboard')}
      count={problems.length}
      topic={topic}
    />
  )

  if (!problems.length) return null

  const problem = problems[current]

  const cardStyle = {
    ...styles.problemCard,
    ...(cardState === 'correct' ? styles.cardCorrect : {}),
    ...(cardState === 'wrong'   ? styles.cardWrong   : {}),
  }

  return (
    <div style={styles.screen}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Terug</button>
        <div style={styles.topicChip}>{topic.toUpperCase()} · JAAR {grade}</div>
      </div>

      <StoryBanner story={problem.story} />
      <ProgressDots total={problems.length} completed={completed} />

      <div style={cardStyle} className={cardState === 'wrong' ? 'shake' : ''}>
        <div style={styles.problemText}>{problem.question}</div>
      </div>

      <div style={styles.answerRow}>
        <input
          style={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="?"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitting && submitAnswer()}
          aria-label="Jouw antwoord"
          disabled={submitting}
        />
        <button style={styles.btnPrimary} onClick={submitAnswer} disabled={submitting}>
          {submitting ? '...' : 'Controleer'}
        </button>
        <button style={styles.btnGhost} onClick={skipProblem} disabled={submitting}>
          Sla over
        </button>
      </div>

      <div style={{
        ...styles.feedbackArea,
        ...(feedback?.type === 'correct' ? styles.feedbackCorrect : {}),
        ...(feedback?.type === 'wrong'   ? styles.feedbackWrong   : {}),
        ...(feedback?.type === 'error'   ? styles.feedbackWrong   : {}),
        opacity: feedback ? 1 : 0,
      }}>
        {feedback && (
          <>
            {feedback.message}
            {feedback.hint && <span style={styles.hint}>Tip: {feedback.hint}</span>}
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .shake { animation: shake 0.35s ease-in-out; }
      `}</style>
    </div>
  )
}

function DoneScreen({ onRetry, onHome, onDashboard, count, topic }) {
  return (
    <div style={styles.center}>
      <div style={styles.doneCard}>
        <div style={styles.doneEmoji}>⭐</div>
        <h2 style={styles.doneTitle}>Sessie voltooid!</h2>
        <p style={styles.doneSub}>{count} opgaven gedaan — geweldig!</p>
        <div style={styles.doneActions}>
          <button style={styles.btnPrimary} onClick={onRetry}>Nog een keer</button>
          <button style={styles.btnGhost} onClick={onHome}>← Terug</button>
          <button style={styles.btnGhost} onClick={onDashboard}>📊 Voortgang</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    maxWidth: '540px',
    margin: '32px auto',
    padding: '24px',
    fontFamily: 'var(--font-body)',
  },
  center: {
    maxWidth: '540px',
    margin: '80px auto',
    padding: '24px',
    textAlign: 'center',
    fontFamily: 'var(--font-body)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  backBtn: {
    background: 'var(--surface)',
    color: 'var(--primary-mid)',
    border: '2px solid var(--border)',
    borderRadius: '50px',
    padding: '6px 14px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  topicChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--primary-light)',
    background: 'var(--primary-tint)',
    borderRadius: '9999px',
    padding: '4px 12px',
  },
  loadingText: { fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--muted)' },
  errorMsg: { color: 'var(--wrong)', fontWeight: 600, marginBottom: '16px' },
  problemCard: {
    background: 'var(--surface)',
    border: '3px solid var(--border-strong)',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '14px',
    boxShadow: 'var(--shadow-md)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  cardCorrect: {
    borderColor: 'var(--correct)',
    boxShadow: '0 0 0 4px var(--correct-tint), var(--shadow-md)',
  },
  cardWrong: {
    borderColor: 'var(--wrong)',
    boxShadow: '0 0 0 4px var(--wrong-tint), var(--shadow-md)',
  },
  problemText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '20px',
    lineHeight: 1.45,
    color: 'var(--text)',
  },
  answerRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'stretch',
    marginBottom: '10px',
  },
  input: {
    width: '88px',
    border: '3px solid var(--border-strong)',
    borderRadius: '8px',
    padding: '0 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '26px',
    fontWeight: 700,
    textAlign: 'center',
    color: 'var(--text)',
    background: 'var(--surface)',
    height: '52px',
    outline: 'none',
  },
  btnPrimary: {
    flex: 1,
    background: 'var(--primary-grad)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    height: '52px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-btn)',
  },
  btnGhost: {
    background: 'var(--surface)',
    color: 'var(--primary-mid)',
    border: '2px solid var(--border)',
    borderRadius: '8px',
    height: '52px',
    padding: '0 16px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  feedbackArea: {
    minHeight: '44px',
    borderRadius: '8px',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.5,
    transition: 'opacity 0.2s',
  },
  feedbackCorrect: { background: 'var(--correct-tint)', color: 'var(--correct)' },
  feedbackWrong:   { background: 'var(--wrong-tint)',   color: 'var(--wrong)' },
  hint: {
    display: 'block',
    fontWeight: 500,
    fontSize: '13px',
    color: 'var(--muted)',
    marginTop: '3px',
  },
  doneCard: {
    background: 'var(--surface)',
    border: '3px solid var(--primary-mid)',
    borderRadius: '20px',
    padding: '36px 28px',
    boxShadow: 'var(--shadow-md)',
  },
  doneEmoji: { fontSize: '52px', marginBottom: '8px', display: 'block' },
  doneTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '28px',
    color: 'var(--primary)',
    marginBottom: '6px',
  },
  doneSub: { fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' },
  doneActions: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' },
}
