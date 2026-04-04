// ============================================================
// main.tsx — App entry point
// ============================================================
// This is the first file that runs. It:
//   1. Imports global styles
//   2. Wraps the app in React Router (for URL-based navigation)
//   3. Wraps the app in our AuthProvider (for login state)
//   4. Mounts everything into the <div id="root"> in index.html
// ============================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './styles/global.css'

// document.getElementById('root') is the div in index.html
// The '!' tells TypeScript "trust me, this element exists"
ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode runs your components twice in development to
  // help catch bugs — it has no effect in production
  <React.StrictMode>
    {/* BrowserRouter enables URL-based navigation (e.g. /recipe/123) */}
    <BrowserRouter>
      {/* AuthProvider makes the logged-in user available everywhere */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
