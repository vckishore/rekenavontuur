import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StoryBanner from './StoryBanner.jsx'
import ProgressDots from './ProgressDots.jsx'

const TOPIC = 'multiplication'
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
        setError(data.detail || 'Could not load problems. Try again later.')
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
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !problems[current]) return
    const problem = problems[current]
    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        problem_id: problem.id,
        topic: problem.topic,
        grade: problem.grade,
        question_text: problem.question,
        user_answer: answer.trim(),
        attempt_number: attemptRef.current,
      }),
    })
    const data = await res.json()

    if (data.error) {
      setFeedback({ type: 'error', message: data.error })
      return
    }

    if (data.correct) {
      const next = completed + 1
      setCompleted(next)
      setFeedback({ type: 'correct', message: 'Correct!' })
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
      setFeedback({ type: 'wrong', message: 'Not quite.', hint: data.hint })
    }
  }

  function skipProblem() {
    if (current < problems.length - 1) {
      setCurrent(c => c + 1)
      setAnswer('')
      setFeedback(null)
      attemptRef.current = 1
    }
  }

  if (loading) return <div style={styles.center}>Loading problems...</div>
  if (error) return (
    <div style={styles.center}>
      <p style={{ color: '#c00', marginBottom: '12px' }}>{error}</p>
      <button style={styles.btn} onClick={startSession}>Try Again</button>
    </div>
  )
  if (done) return (
    <div style={styles.center}>
      <h2 style={{ fontFamily: 'monospace', marginBottom: '16px' }}>Session complete!</h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={styles.btnPrimary} onClick={startSession}>Play again</button>
        <button style={styles.btn} onClick={() => navigate('/dashboard')}>
          View dashboard
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
          [ {problem.topic.toUpperCase()} · GRADE {problem.grade} ]
        </span>
        {problem.question}
      </div>

      <div style={styles.answerRow}>
        <input
          style={styles.input}
          type="text"
          inputMode="numeric"
          placeholder="?"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitAnswer()}
          aria-label="Your answer"
        />
        <button style={styles.btnPrimary} onClick={submitAnswer}>Check</button>
        <button style={styles.btn} onClick={skipProblem}>Skip →</button>
      </div>

      <div style={styles.feedbackArea}>
        {feedback ? (
          <>
            <span style={{ color: feedback.type === 'correct' ? '#060' : '#900' }}>
              {feedback.message}
            </span>
            {feedback.hint && (
              <span style={{ display: 'block', marginTop: '4px', color: '#555' }}>
                Hint: {feedback.hint}
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
    fontSize: '12px',
    minHeight: '36px',
  },
}
