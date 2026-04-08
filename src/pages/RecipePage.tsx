// ============================================================
// pages/RecipePage.tsx — View a single recipe
// ============================================================
// This is the heart of the app. Features:
//   - Quick View: clean ingredient list + short steps
//   - Deep Dive: adds technique notes and tips per step
//   - Servings scaler: adjusts ingredient amounts proportionally
//   - Edit / Delete buttons for the recipe owner
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, deleteRecipe } from '../lib/recipes'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../types'

type ViewMode = 'quick' | 'deep'

export default function RecipePage() {
  // useParams reads the :id from the URL, e.g. /recipe/abc123 → id = "abc123"
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('quick')
  const [servings, setServings] = useState(4)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const data = await getRecipe(id!)
        setRecipe(data)
        // Initialise the servings scaler with the recipe's base servings
        setServings(data.servings || 4)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ---- Servings scaler ----
  // Multiplies ingredient amounts by (current servings / base servings)
  const scaleAmount = (amount: string): string => {
    if (!recipe) return amount
    const base = recipe.servings || 4
    const ratio = servings / base

    // Try to parse the amount as a number (handles "2", "1.5", "1/2")
    const match = amount.match(/^(\d+(?:\.\d+)?)(.*)$/)
    if (!match) return amount // Can't parse — return as-is (e.g. "a pinch")

    const num = parseFloat(match[1]) * ratio
    const rest = match[2] // Any text after the number, e.g. " large"

    // Format nicely: whole numbers without decimals, others to 1dp
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1)
    return formatted + rest
  }

  // ---- Delete ----
  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteRecipe(id)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
      setDeleting(false)
    }
  }

  // Whether the current user owns this recipe (shows edit/delete buttons)
  const isOwner = user && recipe && user.id === recipe.user_id

  // ---- Loading / error states ----
  if (loading) {
    return <div style={styles.status}>Loading recipe...</div>
  }
  if (error || !recipe) {
    return (
      <div style={styles.status}>
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error || 'Recipe not found.'}</p>
        <Link to="/" style={{ color: 'var(--rust)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          ← Back to my recipes
        </Link>
      </div>
    )
  }

  return (
    <div style={styles.page} className="page-enter">

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <Link to="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>My recipes</Link>
        <span style={{ margin: '0 0.4rem' }}>→</span>
        <span style={{ color: 'var(--rust)' }}>{recipe.title}</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{recipe.title}</h1>

        {recipe.description && (
          <p style={styles.desc}>{recipe.description}</p>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {recipe.tags.map((tag) => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Meta bar */}
        <div style={styles.metaBar}>
          {recipe.prep_time && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Prep</span>
              <span style={styles.metaValue}>{recipe.prep_time}</span>
            </div>
          )}
          {recipe.cook_time && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Cook</span>
              <span style={styles.metaValue}>{recipe.cook_time}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Difficulty</span>
              <span style={styles.metaValue}>{recipe.difficulty}</span>
            </div>
          )}
          {recipe.source_url && (
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Source</span>
              <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
                style={{ ...styles.metaValue, fontSize: '0.8rem', color: 'var(--rust)' }}>
                Original ↗
              </a>
            </div>
          )}
        </div>

        {/* Quick View / Deep Dive toggle */}
        <div style={styles.toggleRow}>
          <div style={styles.toggle}>
            <button
              style={{ ...styles.toggleOpt, ...(viewMode === 'quick' ? styles.toggleActive : {}) }}
              onClick={() => setViewMode('quick')}
            >
              Quick View
            </button>
            <button
              style={{ ...styles.toggleOpt, ...(viewMode === 'deep' ? styles.toggleActive : {}) }}
              onClick={() => setViewMode('deep')}
            >
              Deep Dive
            </button>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div style={styles.ownerActions}>
              <Link to={`/edit/${recipe.id}`} style={styles.editBtn}>Edit</Link>
              <button style={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Deep Dive explanation */}
        {viewMode === 'deep' && (
          <p style={styles.deepNote}>
            Deep Dive adds technique notes, the "why" behind each step, and tips for getting it right.
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div style={styles.confirmBox}>
          <p style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
            Delete <strong>{recipe.title}</strong>? This can't be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main content: ingredients sidebar + steps */}
      <div className="recipe-layout">

        {/* Ingredients panel */}
        <div style={styles.ingredientsPanel} className="recipe-ingredients-sticky">
          <div style={styles.panelTitle}>Ingredients</div>

          {/* Servings scaler */}
          {recipe.servings > 0 && (
            <div style={styles.servingsRow}>
              <span style={styles.servingsLabel}>Serves</span>
              <button style={styles.servingsBtn} onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
              <span style={styles.servingsCount}>{servings}</span>
              <button style={styles.servingsBtn} onClick={() => setServings(servings + 1)}>+</button>
            </div>
          )}

          {/* Ingredient list */}
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ing, i) => (
              <div key={i} style={styles.ingredientRow}>
                <div>
                  <div style={styles.ingrName}>{ing.name}</div>
                  {/* Only show ingredient notes in Deep Dive mode */}
                  {viewMode === 'deep' && ing.note && (
                    <div style={styles.ingrNote}>{ing.note}</div>
                  )}
                </div>
                <div style={styles.ingrAmount}>
                  {ing.amount ? scaleAmount(ing.amount) : ''}
                  {ing.unit ? ` ${ing.unit}` : ''}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              No ingredients listed.
            </p>
          )}
        </div>

        {/* Steps */}
        <div>
          <div style={styles.stepsTitle}>Method</div>

          {recipe.steps && recipe.steps.length > 0 ? (
            recipe.steps.map((step, i) => (
              <div key={i} style={styles.stepBlock}>
                {/* Large faded step number */}
                <div style={styles.stepNumber}>{i + 1}</div>

                <div style={{ flex: 1 }}>
                  {/* Always show the basic instruction */}
                  <p style={styles.stepBasic}>{step.basic_instruction}</p>

                  {/* Deep Dive: show the detailed notes */}
                  {viewMode === 'deep' && step.detail_instruction && (
                    <div style={styles.stepDetail}>{step.detail_instruction}</div>
                  )}

                  {/* Tip callout — only in Deep Dive if there's a tip */}
                  {viewMode === 'deep' && step.tip && (
                    <span style={styles.stepTip}>⚠ {step.tip}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No steps added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '2.5rem 2rem' },
  status: { padding: '4rem 2rem', textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' },
  breadcrumb: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  header: { marginBottom: '2rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--ink)', marginBottom: '0.75rem' },
  desc: { fontSize: '1rem', color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '600px', fontStyle: 'italic', marginBottom: '1rem' },
  tag: { display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--cream)', color: 'var(--ink-muted)', borderRadius: '3px', padding: '0.2rem 0.5rem', marginRight: '0.3rem', border: '1px solid var(--border)' },
  metaBar: { display: 'flex', gap: '1.5rem', padding: '1rem 1.25rem', background: 'var(--warm-white)', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', marginBottom: '1.5rem' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  metaLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)' },
  metaValue: { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' },
  toggle: { display: 'inline-flex', background: 'var(--warm-white)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '3px' },
  toggleOpt: { fontFamily: 'var(--font-body)', fontSize: '0.85rem', padding: '0.4rem 1.1rem', borderRadius: '5px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ink-muted)', transition: 'all 0.2s' },
  toggleActive: { background: 'var(--ink)', color: 'var(--cream)', fontWeight: 500 },
  deepNote: { fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: '0.25rem' },
  ownerActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--ink-muted)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.8rem', textDecoration: 'none' },
  deleteBtn: { fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--error)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.35rem 0.8rem', background: 'none', cursor: 'pointer' },
  confirmBox: { background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' },
  confirmDeleteBtn: { background: 'var(--error)', color: 'white', border: 'none', borderRadius: '5px', padding: '0.45rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.45rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--ink-muted)' },
  layout: {},
  ingredientsPanel: { background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' },
  panelTitle: { fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' },
  servingsRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' },
  servingsLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', flex: 1 },
  servingsBtn: { width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  servingsCount: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', minWidth: '1.5rem', textAlign: 'center' },
  ingredientRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0', borderBottom: '1px solid var(--border)', gap: '0.5rem' },
  ingrName: { fontSize: '0.88rem', color: 'var(--ink-soft)' },
  ingrNote: { fontSize: '0.75rem', color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: '0.1rem' },
  ingrAmount: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--rust)', whiteSpace: 'nowrap', fontWeight: 500 },
  stepsTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' },
  stepBlock: { display: 'flex', gap: '1.25rem', marginBottom: '1.75rem' },
  stepNumber: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--border)', lineHeight: 1, minWidth: '2rem', textAlign: 'right', paddingTop: '0.1rem' },
  stepBasic: { fontSize: '1rem', color: 'var(--ink-soft)', lineHeight: 1.65 },
  stepDetail: { fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontStyle: 'italic', background: 'var(--cream)', borderLeft: '2.5px solid var(--gold)', padding: '0.6rem 0.9rem', borderRadius: '0 6px 6px 0', marginTop: '0.5rem' },
  stepTip: { display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--sage)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
}
