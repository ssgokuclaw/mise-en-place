// ============================================================
// components/Nav.tsx
// ============================================================

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        mise<span style={styles.dot}>.</span>en<span style={styles.dot}>.</span>place
      </Link>

      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/" style={styles.link}>My Recipes</Link>
            <Link to="/search" style={styles.link}>Search</Link>
            <Link to="/add" style={styles.addBtn}>+ Add Recipe</Link>
            <button onClick={handleSignOut} style={styles.signOutBtn}>
              Sign out
            </button>
          </>
        ) : (
          <Link to="/auth" style={styles.addBtn}>Sign in</Link>
        )}
      </div>
    </nav>
  )
}

// Inline styles — using a styles object keeps JSX clean
// while keeping styles co-located with the component
const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: 'var(--warm-white)',
    borderBottom: '1px solid var(--border)',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--ink)',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
  },
  dot: { color: 'var(--rust)' },
  links: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  link: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    color: 'var(--ink-muted)',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  addBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    background: 'var(--rust)',
    color: 'white',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 500,
  },
  signOutBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    color: 'var(--ink-muted)',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
}
