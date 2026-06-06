import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Routine from './pages/Routine'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'

function PrivateRoute({ children }) {
  const { user } = useStore()
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const { user } = useStore()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/todo" element={<Todo />} />
                <Route path="/routine" element={<Routine />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }/>
      </Routes>
    </BrowserRouter>
  )
}
