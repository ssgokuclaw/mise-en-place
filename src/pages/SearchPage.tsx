import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getIngredientNames, searchRecipesByIngredients, searchRecipesByName, getAllVisibleRecipes } from '../lib/recipes'
import type { Recipe } from '../types'

export default function SearchPage() {
  const [allIngredients, setAllIngredients] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Recipe[] | null>(null)
  const [nameQuery, setNameQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getIngredientNames().then(setAllIngredients).catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = allIngredients.filter(
    (ing) => ing.includes(query.toLowerCase()) && !selected.includes(ing)
  )

  const addIngredient = (name: string) => {
    setSelected((prev) => [...prev, name])
    setQuery('')
    setResults(null)
    inputRef.current?.focus()
  }

  const removeIngredient = (name: string) => {
    setSelected((prev) => prev.filter((s) => s !== name))
    setResults(null)
  }

  const handleIngredientSearch = async () => {
    if (selected.length === 0) return
    setSearching(true)
    setError('')
    try {
      const data = await searchRecipesByIngredients(selected)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  const handleNameSearch = async () => {
    if (!nameQuery.trim()) return
    setSearching(true)
    setError('')
    try {
      const data = await searchRecipesByName(nameQuery.trim())
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  const handleShowAll = async () => {
    setSearching(true)
    setError('')
    try {
      const data = await getAllVisibleRecipes()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Search</h1>
      </div>

      {/* Recipe name search */}
      <div style={styles.pickerCard}>
        <div style={styles.sectionLabel}>Search by name</div>
        <div style={styles.nameRow}>
          <input
            style={styles.comboInput}
            type="text"
            placeholder="e.g. pasta, chicken soup..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
          />
          <button
            style={{ ...styles.searchBtn, width: 'auto', padding: '0.65rem 1.25rem', opacity: nameQuery.trim() ? 1 : 0.45 }}
            onClick={handleNameSearch}
            disabled={!nameQuery.trim() || searching}
          >
            Search
          </button>
        </div>
      </div>

      <div style={styles.dividerRow}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine} />
      </div>

      {/* Ingredient picker */}
      <div style={styles.pickerCard}>
        <div style={styles.sectionLabel}>Search by ingredients</div>
        <p style={styles.sectionSub}>Pick one or more ingredients to find every recipe that uses all of them.</p>
        <div style={styles.chips}>
          {selected.map((name) => (
            <span key={name} style={styles.chip}>
              {name}
              <button style={styles.chipRemove} onClick={() => removeIngredient(name)}>✕</button>
            </span>
          ))}
          <div ref={containerRef} style={styles.inputWrap}>
            <input
              ref={inputRef}
              style={styles.comboInput}
              placeholder={selected.length === 0 ? 'Type an ingredient...' : 'Add another...'}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setDropdownOpen(false)
                if (e.key === 'Enter' && filtered.length > 0) addIngredient(filtered[0])
              }}
            />
            {dropdownOpen && query.length > 0 && filtered.length > 0 && (
              <div style={styles.dropdown}>
                {filtered.slice(0, 20).map((ing) => (
                  <button key={ing} style={styles.dropdownItem} onMouseDown={() => addIngredient(ing)}>
                    {ing}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          style={{ ...styles.searchBtn, opacity: selected.length === 0 ? 0.45 : 1 }}
          onClick={handleIngredientSearch}
          disabled={selected.length === 0 || searching}
        >
          {searching ? 'Searching...' : 'Find recipes'}
        </button>
      </div>

      <div style={styles.dividerRow}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine} />
      </div>

      <button style={styles.showAllBtn} onClick={handleShowAll} disabled={searching}>
        {searching ? 'Loading...' : 'Show all recipes'}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {/* Results */}
      {results !== null && (
        <div style={styles.results}>
          {results.length === 0 ? (
            <p style={styles.empty}>No recipes found with all of those ingredients.</p>
          ) : (
            <>
              <div style={styles.resultsLabel}>
                {results.length} recipe{results.length !== 1 ? 's' : ''} found
              </div>
              <div style={styles.grid}>
                {results.map((recipe) => (
                  <Link key={recipe.id} to={`/recipe/${recipe.id}`} style={styles.card}>
                    <div style={styles.cardTitle}>{recipe.title}</div>
                    {recipe.description && (
                      <p style={styles.cardDesc}>{recipe.description}</p>
                    )}
                    <div style={styles.cardMeta}>
                      {recipe.cook_time && <span>{recipe.cook_time}</span>}
                      {recipe.difficulty && <span>{recipe.difficulty}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem' },
  header: { marginBottom: '2rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' },
  sub: { color: 'var(--ink-muted)', fontSize: '0.9rem' },
  pickerCard: { background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' },
  chips: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--rust)', color: 'white', borderRadius: '999px', padding: '0.3rem 0.75rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem' },
  chipRemove: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '0.7rem', opacity: 0.8 },
  inputWrap: { position: 'relative' as const, flex: 1, minWidth: '180px' },
  comboInput: { width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.9rem', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem', background: 'var(--cream)', color: 'var(--ink)', outline: 'none' },
  dropdown: { position: 'absolute' as const, top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '6px', zIndex: 50, maxHeight: '220px', overflowY: 'auto' as const, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  dropdownItem: { display: 'block', width: '100%', textAlign: 'left' as const, background: 'none', border: 'none', padding: '0.55rem 0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ink)', cursor: 'pointer' },
  searchBtn: { background: 'var(--rust)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.65rem 1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', width: '100%' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: '0.75rem' },
  sectionSub: { fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' },
  nameRow: { display: 'flex', gap: '0.5rem' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border)' },
  dividerText: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-muted)' },
  showAllBtn: { width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.65rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--ink-muted)', cursor: 'pointer' },
  error: { color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: '5px', marginBottom: '1rem' },
  results: { marginTop: '0.5rem' },
  resultsLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: '1rem' },
  empty: { color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textAlign: 'center' as const, padding: '2rem 0' },
  grid: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  card: { display: 'block', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem', textDecoration: 'none', color: 'inherit' },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' },
  cardDesc: { fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '0.5rem', lineHeight: 1.5 },
  cardMeta: { display: 'flex', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
}
