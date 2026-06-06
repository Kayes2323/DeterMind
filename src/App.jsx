import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from './store'
import { supabase } from './lib/supabase'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Routine from './pages/Routine'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'

function PrivateRoute({ children, user }) {
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const { setUser, user } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
        })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-body">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/*" element={
          <PrivateRoute user={user}>
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