import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Store from './Store'
import Auth from './Auth'
import Admin from './Admin'
import { useSession } from './useSession'

export default function App() {
  const session = useSession()
  const [theme, setTheme] = useState(() => {
    try { const t = localStorage.getItem('ssr-theme'); if (t) return t } catch { /* private mode */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('ssr-theme', theme) } catch { /* private mode */ }
  }, [theme])
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Store session={session} theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/admin/*" element={
          session === undefined ? <p className="center">Loading…</p>
            : session ? <Admin theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}