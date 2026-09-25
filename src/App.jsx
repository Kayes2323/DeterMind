import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSmartNotification } from './hooks/useNotification'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Routine from './pages/Routine'
import Sigma from './pages/Sigma'
import Focus from './pages/Focus'
import Profile from './pages/Profile'

function AppContent() {
  useSmartNotification()
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/sigma" element={<Sigma />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
