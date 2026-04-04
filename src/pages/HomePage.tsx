// ============================================================
// pages/HomePage.tsx — The main dashboard
// ============================================================
// Shows all of the logged-in user's saved recipes as a grid
// of cards. Also has a search/filter bar.
//
// Data flow:
//   1. On mount, call getMyRecipes() from lib/recipes.ts
//   2. Store results in state
//   3. Filter results locally based on search input
//   4. Render a RecipeCard for each result
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyRecipes } from '../lib/recipes'
import RecipeCard from '../components/RecipeCard'
import type { Recipe } from '../types'

export default function HomePage() {
  // All recipes from the database
  const [recipes, setRecipes] = useState<Recipe[]>([])
  // Whether we're still fetching from the DB
  const [loading, setLoading] = useState(true)
  // Any error that occurred during fetch
  const [error, setError] = useState('')
  // What the user has typed in the search box
  const [search, setSearch] = useState('')

  // useEffect runs after the component first renders.
  // The empty [] dependency array means "run once on mount".
  useEffect(() => {
    async function load() {
      try {
        const data = await getMyRecipes()
        setRecipes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipes.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter recipes client-side as the user types.
  // .toLowerCase() makes the search case-insensitive.
  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <div style={styles.page} className="page-enter">

      {/* Hero + actions */}
      <div style={styles.hero}>
        <h1 style={styles.tagline}>
          Your recipes.<br /><em style={styles.em}>Nothing else.</em>
        </h1>
        <p style={styles.sub}>
          No life stories. No ads. No pop-ups. Just the ingredients and the steps.
        </p>
        <div style={styles.actions}>
          <Link to="/add" style={styles.primaryBtn}>+ Add a recipe</Link>
        </div>
      </div>

      {/* Search bar — only show if there are recipes */}
      {recipes.length > 0 && (
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            type="search"
            placeholder="Search by title, tag, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p style={styles.statusText}>Loading your recipes...</p>
      )}

      {/* Error state */}
      {error && (
        <p style={{ ...styles.statusText, color: 'var(--error)' }}>{error}</p>
      )}

      {/* Empty state — no recipes yet */}
      {!loading && !error && recipes.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyEmoji}>🍽️</div>
          <h2 style={styles.emptyTitle}>No recipes yet</h2>
          <p style={styles.emptySub}>
            Add your first recipe manually, or import one from any recipe URL.
          </p>
          <Link to="/add" style={styles.primaryBtn}>+ Add your first recipe</Link>
        </div>
      )}

      {/* Empty search results */}
      {!loading && recipes.length > 0 && filtered.length === 0 && (
        <p style={styles.statusText}>No recipes match "{search}"</p>
      )}

      {/* Recipe grid */}
      {filtered.length > 0 && (
        <>
          <p style={styles.sectionLabel}>
            {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All recipes'}
          </p>
          <div style={styles.grid}>
            {filtered.map((recipe) => (
              // Each card gets a unique key — React uses this to track
              // which items changed when the list re-renders
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '3rem 2rem',
  },
  hero: { marginBottom: '2.5rem' },
  tagline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontWeight: 400,
    lineHeight: 1.15,
    color: 'var(--ink)',
    marginBottom: '0.75rem',
  },
  em: { fontStyle: 'italic', color: 'var(--rust)' },
  sub: {
    color: 'var(--ink-muted)',
    fontSize: '1rem',
    maxWidth: '480px',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  actions: { display: 'flex', gap: '0.75rem' },
  primaryBtn: {
    display: 'inline-block',
    background: 'var(--rust)',
    color: 'white',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '0.65rem 1.4rem',
    borderRadius: '6px',
    textDecoration: 'none',
  },
  searchRow: { marginBottom: '1.5rem' },
  searchInput: {
    width: '100%',
    maxWidth: '420px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    background: 'var(--warm-white)',
    color: 'var(--ink)',
    outline: 'none',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--ink-muted)',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  statusText: {
    color: 'var(--ink-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    padding: '2rem 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    maxWidth: '400px',
    margin: '0 auto',
  },
  emptyEmoji: { fontSize: '3rem', marginBottom: '1rem' },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--ink)',
    marginBottom: '0.5rem',
  },
  emptySub: {
    color: 'var(--ink-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
}
