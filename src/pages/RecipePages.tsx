// ============================================================
// pages/AddRecipePage.tsx — Create a new recipe
// ============================================================
// This page just wraps RecipeForm and handles the save logic.
// Keeping the form UI in RecipeForm and the save logic here
// means we can reuse the same form for editing too.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createRecipe } from '../lib/recipes'
import RecipeForm from '../components/RecipeForm'
import type { RecipeFormData } from '../types'

export function AddRecipePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (data: RecipeFormData) => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      // createRecipe returns the new recipe's ID
      const recipeId = await createRecipe(data, user.id)
      // Navigate to the newly created recipe's page
      navigate(`/recipe/${recipeId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe.')
      setSaving(false)
    }
  }

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <h1 style={styles.title}>Add a recipe</h1>
        <p style={styles.sub}>Import from a URL or fill it in manually below.</p>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <RecipeForm onSubmit={handleSubmit} saving={saving} />
    </div>
  )
}

// ============================================================
// pages/EditRecipePage.tsx — Edit an existing recipe
// ============================================================
// Loads the existing recipe, pre-fills the form, and saves
// changes using updateRecipe() instead of createRecipe().
// ============================================================

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRecipe, updateRecipe } from '../lib/recipes'
import type { Recipe } from '../types'

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load the existing recipe to pre-fill the form
  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const data = await getRecipe(id!)
        setRecipe(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (data: RecipeFormData) => {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      await updateRecipe(id, data)
      navigate(`/recipe/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={styles.status}>Loading recipe...</div>
  }

  if (error && !recipe) {
    return <div style={{ ...styles.status, color: 'var(--error)' }}>{error}</div>
  }

  // Convert the loaded recipe into the shape RecipeForm expects
  // (RecipeFormData strips out DB-only fields like id, user_id, created_at)
  const initialData: RecipeFormData | undefined = recipe
    ? {
        title:       recipe.title,
        description: recipe.description,
        prep_time:   recipe.prep_time,
        cook_time:   recipe.cook_time,
        servings:    recipe.servings,
        difficulty:  recipe.difficulty,
        tags:        recipe.tags ?? [],
        is_public:   recipe.is_public,
        source_url:  recipe.source_url,
        ingredients: (recipe.ingredients ?? []).map(({ name, amount, unit, note, sort_order }) => ({
          name, amount, unit, note, sort_order,
        })),
        steps: (recipe.steps ?? []).map(({ sort_order, basic_instruction, detail_instruction, tip }) => ({
          sort_order, basic_instruction, detail_instruction, tip,
        })),
      }
    : undefined

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.header}>
        <h1 style={styles.title}>Edit recipe</h1>
        <p style={styles.sub}>{recipe?.title}</p>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <RecipeForm initialData={initialData} onSubmit={handleSubmit} saving={saving} />
    </div>
  )
}

// Shared styles for both pages
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem' },
  header: { marginBottom: '2rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' },
  sub: { color: 'var(--ink-muted)', fontSize: '0.9rem' },
  error: { color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '6px' },
  status: { padding: '4rem 2rem', textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' },
}
