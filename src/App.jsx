import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useStore } from './store'
import { auth, ensureAnonymousUser } from './lib/firebase'
import { useSmartNotification } from './hooks/useNotification'
import Layout from './components/layout/Layout'
import RequireAuth from './components/auth/RequireAuth'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import Routine from './pages/Routine'
import Sigma from './pages/Sigma'
import Focus from './pages/Focus'
import Profile from './pages/Profile'

function AppContent() {
  useSmartNotification()
  const { setUser, logout } = useStore()

  // Browsing never needs login: a silent anonymous session gives every
  // visitor an id so local data can get an optional Firestore backup (see
  // src/lib/firebase.js and useCloudSync.js). Actually using a feature
  // (see RequireAuth) needs a real Google-linked account instead.
  useEffect(() => {
    ensureAnonymousUser()
    if (!auth) return
    const unsub = onAuthStateChanged(auth, fbUser => {
      if (!fbUser) { logout(); return }
      setUser({
        id: fbUser.uid,
        isAnonymous: fbUser.isAnonymous,
        name: fbUser.displayName || '',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || '',
      })
    })
    return unsub
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/todo" element={<RequireAuth><Todo /></RequireAuth>} />
        <Route path="/routine" element={<RequireAuth><Routine /></RequireAuth>} />
        <Route path="/sigma" element={<RequireAuth><Sigma /></RequireAuth>} />
        <Route path="/focus" element={<RequireAuth><Focus /></RequireAuth>} />
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
