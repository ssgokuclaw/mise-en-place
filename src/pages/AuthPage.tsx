// ============================================================
// pages/AuthPage.tsx — Login & Sign Up
// ============================================================
// Handles four auth methods:
//   1. Google OAuth (one-click)
//   2. Email + password sign in
//   3. Email + password sign up
//   4. Username + password sign up (no email — with warning)
//
// The username-only path works by generating a fake internal
// email address (username@mise.local) so Supabase's auth system
// still has an email field, while the user never needs to provide
// a real one. The username is stored in the display_name metadata.
//
// The tradeoff: without a real email, the account cannot be
// recovered if the password is lost. We warn the user clearly
// and make them confirm they understand before proceeding.
// ============================================================

import { useState } from 'react'
import { supabase } from '../lib/supabase'

type SignupMethod = 'email' | 'username'
type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [signupSent, setSignupSent] = useState(false)
  const [username, setUsername] = useState('')
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)

  const reset = () => {
    setError('')
    setEmail('')
    setUsername('')
    setPassword('')
    setWarningAcknowledged(false)
    setSignupSent(false)
  }

  // ----------------------------------------------------------------
  // Sign In — accepts real email OR username
  // ----------------------------------------------------------------
  const handleSignIn = async () => {
    setError('')
    const rawInput = email.trim()
    if (!rawInput || !password.trim()) {
      setError('Please enter your username or email, and your password.')
      return
    }
    // If the input has "@" treat as email; otherwise reconstruct the
    // synthetic email we created at username signup.
    const loginEmail = rawInput.includes('@')
      ? rawInput
      : `${rawInput.toLowerCase()}@mise.local`

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (error) throw error
    } catch {
      setError('Incorrect username/email or password.')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------------
  // Sign Up — Email path
  // ----------------------------------------------------------------
  const handleEmailSignup = async () => {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) throw error
      setSignupSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------------
  // Sign Up — Username-only path
  // ----------------------------------------------------------------
  // Creates a synthetic @mise.local email so Supabase auth works
  // without the user ever providing a real email address.
  // IMPORTANT: In Supabase dashboard → Authentication → Settings,
  // disable "Enable email confirmations" so these accounts activate
  // immediately (there's no real inbox to click a link from).
  const handleUsernameSignup = async () => {
    setError('')
    if (!username.trim()) {
      setError('Please choose a username.')
      return
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username.trim())) {
      setError('Username must be 3–20 characters: letters, numbers, _ or - only.')
      return
    }
    if (!password.trim() || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!warningAcknowledged) {
      setError('Please confirm you understand the account recovery warning.')
      return
    }

    const syntheticEmail = `${username.trim().toLowerCase()}@mise.local`

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: { display_name: username.trim(), username_only: true },
          emailRedirectTo: undefined,
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('That username is already taken. Try another.')
        }
        throw error
      }
      // Username accounts log in immediately — no confirmation email needed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Google OAuth ----
  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  // ================================================================
  // Email confirmation sent screen
  // ================================================================
  if (signupSent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>mise<span style={styles.dot}>.</span>en<span style={styles.dot}>.</span>place</div>
          <h2 style={styles.title}>Check your email</h2>
          <p style={styles.sub}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to sign in.
          </p>
          <button style={styles.linkBtn} onClick={() => { reset(); setMode('signin') }}>
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ================================================================
  // Main render
  // ================================================================
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logo}>
          mise<span style={styles.dot}>.</span>en<span style={styles.dot}>.</span>place
        </div>

        {/* Sign in / Create account tabs */}
        <div style={styles.modeTabs}>
          <button
            style={{ ...styles.modeTab, ...(mode === 'signin' ? styles.modeTabActive : {}) }}
            onClick={() => { setMode('signin'); reset() }}
          >
            Sign in
          </button>
          <button
            style={{ ...styles.modeTab, ...(mode === 'signup' ? styles.modeTabActive : {}) }}
            onClick={() => { setMode('signup'); reset() }}
          >
            Create account
          </button>
        </div>

        {/* ---- SIGN IN ---- */}
        {mode === 'signin' && (
          <>
            <button style={styles.googleBtn} onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </button>
            <div style={styles.divider}>or</div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email or username</label>
              <input
                style={styles.input}
                type="text"
                placeholder="you@example.com or your_username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                autoComplete="username"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                autoComplete="current-password"
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.submitBtn} onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </>
        )}

        {/* ---- SIGN UP ---- */}
        {mode === 'signup' && (
          <>
            <button style={styles.googleBtn} onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </button>
            <div style={styles.divider}>or create with</div>

            {/* Email vs Username-only toggle */}
            <div style={styles.methodTabs}>
              <button
                style={{ ...styles.methodTab, ...(signupMethod === 'email' ? styles.methodTabActive : {}) }}
                onClick={() => { setSignupMethod('email'); reset() }}
              >
                📧 Email
              </button>
              <button
                style={{ ...styles.methodTab, ...(signupMethod === 'username' ? styles.methodTabActive : {}) }}
                onClick={() => { setSignupMethod('username'); reset() }}
              >
                👤 Username only
              </button>
            </div>

            {/* EMAIL SIGNUP */}
            {signupMethod === 'email' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input style={styles.input} type="password" placeholder="At least 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <button style={styles.submitBtn} onClick={handleEmailSignup} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </>
            )}

            {/* USERNAME-ONLY SIGNUP */}
            {signupMethod === 'username' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username</label>
                  <input style={styles.input} type="text" placeholder="e.g. home_chef_42"
                    value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                  <p style={styles.hint}>3–20 characters. Letters, numbers, _ and - only.</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input style={styles.input} type="password" placeholder="At least 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>

                {/* ⚠️ Recovery warning */}
                <div style={styles.warningBox}>
                  <div style={styles.warningTitle}>⚠️ No email — no recovery</div>
                  <p style={styles.warningText}>
                    Without an email address, <strong>your account cannot be recovered</strong> if
                    you forget your password. There is no "forgot my password" option.
                  </p>
                  <p style={styles.warningText}>
                    If you lose access, <strong>all your saved recipes will be permanently gone.</strong>{' '}
                    You can add an email later in account settings, or use the email signup instead.
                  </p>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={warningAcknowledged}
                      onChange={(e) => setWarningAcknowledged(e.target.checked)}
                      style={{ marginRight: '0.5rem', accentColor: 'var(--rust)', flexShrink: 0, marginTop: '2px' }}
                    />
                    I understand — if I forget my password, I cannot recover this account
                  </label>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <button
                  style={{ ...styles.submitBtn, opacity: warningAcknowledged ? 1 : 0.45 }}
                  onClick={handleUsernameSignup}
                  disabled={loading || !warningAcknowledged}
                >
                  {loading ? 'Creating account...' : 'Create account without email'}
                </button>
              </>
            )}
          </>
        )}

        <p style={styles.footer}>
          {mode === 'signin' ? "No account yet? " : 'Already have an account? '}
          <span style={styles.footerLink} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); reset() }}>
            {mode === 'signin' ? 'Create one free' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem', background: 'var(--cream)' },
  card: { background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '14px', padding: '2.5rem', width: '100%', maxWidth: '420px' },
  logo: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem', letterSpacing: '-0.02em' },
  dot: { color: 'var(--rust)' },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' },
  sub: { color: 'var(--ink-muted)', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.5 },
  modeTabs: { display: 'flex', background: 'var(--cream)', borderRadius: '8px', padding: '3px', marginBottom: '1.5rem', border: '1px solid var(--border)' },
  modeTab: { flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', padding: '0.45rem', borderRadius: '5px', border: 'none', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer' },
  modeTabActive: { background: 'var(--warm-white)', color: 'var(--ink)', fontWeight: 500, boxShadow: '0 1px 3px var(--shadow)' },
  methodTabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' },
  methodTab: { flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', textAlign: 'center' },
  methodTabActive: { borderColor: 'var(--rust)', color: 'var(--rust)', background: '#fef6f3' },
  warningBox: { background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' },
  warningTitle: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400e', marginBottom: '0.5rem', fontWeight: 500 },
  warningText: { fontSize: '0.82rem', color: '#78350f', lineHeight: 1.55, marginBottom: '0.6rem' },
  checkLabel: { display: 'flex', alignItems: 'flex-start', fontSize: '0.8rem', color: '#78350f', fontFamily: 'var(--font-body)', lineHeight: 1.4, cursor: 'pointer', marginTop: '0.25rem' },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', padding: '0.65rem', border: '1.5px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', color: 'var(--ink-soft)', marginBottom: '0.75rem' },
  divider: { textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.75rem', margin: '0.75rem 0', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: '0.4rem' },
  input: { width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.65rem 0.9rem', background: 'var(--cream)', color: 'var(--ink)', outline: 'none' },
  hint: { fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' },
  error: { color: 'var(--error)', fontSize: '0.82rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '5px' },
  submitBtn: { width: '100%', background: 'var(--rust)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.7rem', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', marginTop: '0.25rem', transition: 'opacity 0.15s' },
  footer: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.83rem', color: 'var(--ink-muted)' },
  footerLink: { color: 'var(--rust)', cursor: 'pointer' },
  linkBtn: { marginTop: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--rust)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
}
