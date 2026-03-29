import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PracticeScreen from './components/PracticeScreen.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PracticeScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
