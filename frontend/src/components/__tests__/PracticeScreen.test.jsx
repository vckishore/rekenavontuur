import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PracticeScreen from '../PracticeScreen.jsx'

const MOCK_SESSION = {
  session_id: 1,
  problems: [
    {
      id: 'mult-g3-aaa',
      topic: 'multiplication',
      grade: 3,
      story: 'You are a baker with 3 trays.',
      question: 'If each tray has 8 cookies, how many cookies total?',
      answer: 24,
      hint: 'Multiply 3 by 8',
    },
    {
      id: 'mult-g3-bbb',
      topic: 'multiplication',
      grade: 3,
      story: null,
      question: 'What is 4 x 5?',
      answer: 20,
      hint: 'Count 4 groups of 5',
    },
  ],
}

function mockFetch(sessionData = MOCK_SESSION, answerData = { correct: true, hint: null }) {
  global.fetch = vi.fn().mockImplementation((url, opts) => {
    if (url.includes('/api/sessions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(sessionData) })
    }
    if (url.includes('/api/answers')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(answerData) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
}

function renderPractice() {
  return render(
    <MemoryRouter>
      <PracticeScreen />
    </MemoryRouter>
  )
}

afterEach(() => vi.restoreAllMocks())

test('renders StoryBanner when story is non-null', async () => {
  mockFetch()
  renderPractice()
  await waitFor(() => screen.getByText(/You are a baker/))
  expect(screen.getByText(/You are a baker/)).toBeInTheDocument()
  expect(screen.getByText(/STORY CONTEXT/)).toBeInTheDocument()
})

test('does NOT render StoryBanner when story is null', async () => {
  const sessionWithNullStory = {
    ...MOCK_SESSION,
    problems: [{ ...MOCK_SESSION.problems[1] }],
  }
  mockFetch(sessionWithNullStory)
  renderPractice()
  await waitFor(() => screen.getByText(/What is 4 x 5/))
  expect(screen.queryByText(/STORY CONTEXT/)).not.toBeInTheDocument()
})

test('correct answer shows correct feedback', async () => {
  mockFetch(MOCK_SESSION, { correct: true, hint: null })
  renderPractice()
  await waitFor(() => screen.getByLabelText('Your answer'))

  fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '24' } })
  fireEvent.click(screen.getByText('Check'))

  await waitFor(() => screen.getByText('Correct!'))
  expect(screen.getByText('Correct!')).toBeInTheDocument()
})

test('wrong answer shows incorrect feedback and hint', async () => {
  mockFetch(MOCK_SESSION, { correct: false, hint: 'Multiply 3 by 8' })
  renderPractice()
  await waitFor(() => screen.getByLabelText('Your answer'))

  fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '99' } })
  fireEvent.click(screen.getByText('Check'))

  await waitFor(() => screen.getByText('Not quite.'))
  expect(screen.getByText('Not quite.')).toBeInTheDocument()
  expect(screen.getByText(/Multiply 3 by 8/)).toBeInTheDocument()
})

test('ProgressDots advances after correct answer', async () => {
  mockFetch(MOCK_SESSION, { correct: true, hint: null })
  renderPractice()
  await waitFor(() => screen.getByLabelText('Your answer'))

  // Initially 0 filled dots
  expect(screen.getAllByTestId('dot-empty').length).toBe(2)
  expect(screen.queryAllByTestId('dot-filled').length).toBe(0)

  fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '24' } })
  fireEvent.click(screen.getByText('Check'))

  await waitFor(() => screen.getAllByTestId('dot-filled').length > 0)
  expect(screen.getAllByTestId('dot-filled').length).toBe(1)
})

test('shows error message when pool is empty', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ detail: 'No problems available for topic=multiplication grade=3.' }),
  })
  renderPractice()
  await waitFor(() => screen.getByText(/No problems available/))
  expect(screen.getByText(/No problems available/)).toBeInTheDocument()
})
