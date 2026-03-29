import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Dashboard from '../Dashboard.jsx'

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

afterEach(() => vi.restoreAllMocks())

test('renders zero-state without crashing (no sessions)', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
      total_problems: 0,
      correct_rate: 0,
      total_sessions: 0,
      by_topic: [],
      low_pool_warning: false,
      last_generation_error: null,
    }),
  })
  renderDashboard()
  await waitFor(() => screen.getByText('Parent Dashboard'))
  expect(screen.getByText('0')).toBeInTheDocument()
  expect(screen.getByText(/No sessions yet/)).toBeInTheDocument()
})

test('renders topic stats when sessions exist', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
      total_problems: 47,
      correct_rate: 82.0,
      total_sessions: 6,
      by_topic: [
        { topic: 'multiplication', attempted: 18, correct: 16, accuracy: 88.9 },
        { topic: 'fractions', attempted: 12, correct: 8, accuracy: 66.7 },
      ],
      low_pool_warning: false,
      last_generation_error: null,
    }),
  })
  renderDashboard()
  await waitFor(() => screen.getByText('multiplication'))
  expect(screen.getByText('multiplication')).toBeInTheDocument()
  expect(screen.getByText('fractions')).toBeInTheDocument()
  expect(screen.getByText('47')).toBeInTheDocument()
})

test('shows low pool warning when flag is set', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
      total_problems: 5,
      correct_rate: 80.0,
      total_sessions: 1,
      by_topic: [],
      low_pool_warning: true,
      last_generation_error: null,
    }),
  })
  renderDashboard()
  await waitFor(() => screen.getByText(/problem pool is running low/))
  expect(screen.getByText(/problem pool is running low/)).toBeInTheDocument()
})
