import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StoryBanner from './StoryBanner.jsx'
import ProgressDots from './ProgressDots.jsx'

const TOPIC = 'vermenigvuldigen'
const GRADE = 3

export default function PracticeScreen() {
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
        body: JSON.stringify({ topic: TOPIC, grade: GRADE, count: 5 }),
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
        setFeedback({ type: 'correct', message: 'Juist!' })
        attemptRef.current = 1
        if (next >= problems.length) {
          setTimeout(() => setDone(true), 800)
        } else {
          setTimeout(() => {
            setCurrent(c => c + 1)
            setAnswer('')
            setFeedback(null)
          }, 800)
        }
      } else {
        attemptRef.current += 1
        setFeedback({ type: 'wrong', message: 'Niet helemaal.', hint: data.hint })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Er ging iets mis. Probeer het opnieuw.' })
    } finally {
      setSubmitting(false)
    }
  }

  function skipProblem() {
    if (problems.length === 0) return
    // Rotate current problem to end of queue so it can be retried
    const updated = [...problems]
    const [skipped] = updated.splice(current, 1)
    updated.push(skipped)
    setProblems(updated)
    // current index stays the same (next problem slides into position)
    // unless we were at the last position after splice
    if (current >= updated.length) {
      setCurrent(updated.length - 1)
    }
    setAnswer('')
    setFeedback(null)
    attemptRef.current = 1
  }

  if (loading) return <div style={styles.center}>Opgaven laden...</div>
  if (error) return (
    <div style={styles.center}>
      <p style={{ color: '#c00', marginBottom: '12px' }}>{error}</p>
      <button style={styles.btn} onClick={startSession}>Opnieuw proberen</button>
    </div>
  )
  if (done) return (
    <div style={styles.center}>
      <h2 style={{ fontFamily: 'Georgia, serif', marginBottom: '16px' }}>Oefensessie voltooid!</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={styles.btnPrimary} onClick={startSession}>Nog een keer</button>
        <button style={styles.btn} onClick={() => navigate('/dashboard')}>
          Bekijk resultaten
        </button>
      </div>
    </div>
  )
  if (!problems.length) return null

  const problem = problems[current]

  return (
    <div style={styles.screen}>
      <StoryBanner story={problem.story} />
      <ProgressDots total={problems.length} completed={completed} />

      <div style={styles.problemBox}>
        <span style={styles.problemTag}>
          [ {problem.topic.toUpperCase()} · JAAR {problem.grade} ]
        </span>
        {problem.question}
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
        <button style={styles.btn} onClick={skipProblem} disabled={submitting}>
          Sla over
        </button>
      </div>

      <div style={styles.feedbackArea}>
        {feedback ? (
          <>
            <span style={{ color: feedback.type === 'correct' ? '#060' : '#900' }}>
              {feedback.message}
            </span>
            {feedback.hint && (
              <span style={{ display: 'block', marginTop: '4px', color: '#555' }}>
                Tip: {feedback.hint}
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

const styles = {
  screen: {
    maxWidth: '520px',
    margin: '40px auto',
    padding: '24px',
    fontFamily: 'Georgia, serif',
  },
  center: {
    maxWidth: '520px',
    margin: '80px auto',
    padding: '24px',
    textAlign: 'center',
    fontFamily: 'Georgia, serif',
  },
  problemBox: {
    border: '2px solid #333',
    padding: '16px',
    marginBottom: '16px',
    fontSize: '16px',
    lineHeight: 1.6,
  },
  problemTag: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#aaa',
    display: 'block',
    marginBottom: '8px',
  },
  answerRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '12px',
  },
  input: {
    border: '1px solid #333',
    padding: '8px 12px',
    fontSize: '20px',
    width: '120px',
    fontFamily: 'monospace',
    background: '#fff',
  },
  btn: {
    border: '2px solid #333',
    background: '#fff',
    padding: '8px 16px',
    minHeight: '44px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
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
  },
  feedbackArea: {
    border: '1px dashed #bbb',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: 1.5,
    minHeight: '44px',
  },
}
