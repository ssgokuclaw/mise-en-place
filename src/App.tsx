// ============================================================
// App.tsx — Route definitions
// ============================================================
// React Router maps URL paths to page components.
// When the user navigates to /recipe/abc123, React Router
// renders the RecipePage component with id="abc123".
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Nav from './components/Nav'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import { AddRecipePage, EditRecipePage } from './pages/RecipePages'
import AuthPage from './pages/AuthPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  const { user, loading } = useAuth()

  // Show nothing while we're checking the existing session.
  // Without this, you'd see a flash of the login page on every refresh.
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
          Loading...
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Nav is always visible (it handles showing/hiding items based on auth) */}
      <Nav />

      <Routes>
        {/* Public routes — anyone can visit */}
        <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Protected routes — redirect to /auth if not logged in */}
        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/add"
          element={user ? <AddRecipePage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/edit/:id"
          element={user ? <EditRecipePage /> : <Navigate to="/auth" />}
        />

        {/* Catch-all: redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
