import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home.jsx'
import PracticeScreen from './components/PracticeScreen.jsx'
import Dashboard from './components/Dashboard.jsx'
import Badges from './components/Badges.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/practice"  element={<PracticeScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/badges"    element={<Badges />} />
      </Routes>
    </BrowserRouter>
  )
}
