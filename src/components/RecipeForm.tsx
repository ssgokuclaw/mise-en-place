// ============================================================
// components/RecipeForm.tsx
// ============================================================
// This form is used on both the Add Recipe and Edit Recipe pages.
// It handles:
//   - Manual entry of all recipe fields
//   - URL import (calls importRecipeFromUrl, populates all fields)
//   - Dynamic ingredient/step rows (add/remove)
//   - Form validation (title + at least 1 ingredient required)
//
// It receives an onSubmit callback — the parent page handles
// the actual save/update logic, keeping this component reusable.
// ============================================================

import { useState } from 'react'
import { importRecipeFromUrl } from '../lib/importRecipe'
import type { RecipeFormData } from '../types'

interface RecipeFormProps {
  // Initial values — used when editing an existing recipe
  initialData?: RecipeFormData
  // Called when the user submits the form
  onSubmit: (data: RecipeFormData) => Promise<void>
  // Whether the parent is currently saving (shows loading state)
  saving: boolean
}

// Default empty form state
const EMPTY_FORM: RecipeFormData = {
  title: '',
  description: '',
  prep_time: '',
  cook_time: '',
  servings: 0,
  difficulty: '',
  tags: [],
  is_public: true,
  source_url: '',
  ingredients: [{ name: '', amount: '', unit: '', note: '', sort_order: 0 }],
  steps: [{ sort_order: 0, basic_instruction: '', detail_instruction: '', tip: '' }],
}

export default function RecipeForm({ initialData, onSubmit, saving }: RecipeFormProps) {
  // useState stores the form data. When any field changes, React re-renders the form.
  const [form, setForm] = useState<RecipeFormData>(initialData ?? EMPTY_FORM)
  const [urlInput, setUrlInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [extraOpen, setExtraOpen] = useState(false)

  // ---- URL Import ----
  const handleImport = async () => {
    if (!urlInput.trim()) return
    setImporting(true)
    setImportError('')
    try {
      const parsed = await importRecipeFromUrl(urlInput.trim())
      // Populate the form with the imported data
      setForm({
        title:       parsed.title,
        description: parsed.description,
        prep_time:   parsed.prep_time,
        cook_time:   parsed.cook_time,
        servings:    parsed.servings || 0,
        difficulty:  '',
        tags:        [],
        is_public:   true,
        source_url:  urlInput.trim(),
        ingredients: parsed.ingredients.map((ing, i) => ({ ...ing, sort_order: i })),
        steps:       parsed.steps.map((s, i) => ({ ...s, tip: '', sort_order: i })),
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  // ---- Field helpers ----
  // Update a top-level field (e.g. title, description)
  const setField = <K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Update one ingredient field
  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...form.ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setForm((prev) => ({ ...prev, ingredients: updated }))
  }

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '', note: '', sort_order: prev.ingredients.length }],
    }))
  }

  const removeIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  // Update one step field
  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...form.steps]
    updated[index] = { ...updated[index], [field]: value }
    setForm((prev) => ({ ...prev, steps: updated }))
  }

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, { sort_order: prev.steps.length, basic_instruction: '', detail_instruction: '', tip: '' }],
    }))
  }

  const removeStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  // ---- Tags ----
  // Tags are stored as an array but entered as a comma-separated string
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map((t) => t.trim()).filter(Boolean)
    setField('tags', tags)
  }

  // ---- Validation ----
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Recipe title is required'
    const hasIngredient = form.ingredients.some((i) => i.name.trim())
    if (!hasIngredient) newErrors.ingredients = 'At least one ingredient is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit(form)
  }

  // ---- Render ----
  return (
    <div style={styles.container}>

      {/* URL IMPORT */}
      <div style={styles.importBox}>
        <div style={styles.importLabel}>⚡ Advanced — Import from URL</div>
        <p style={styles.importDesc}>
          Paste any recipe URL and we'll strip the noise — no story, no ads, just the recipe.
        </p>
        <div style={styles.importRow}>
          <input
            style={styles.urlInput}
            type="url"
            placeholder="https://somerecipesite.com/pasta-with-17-paragraphs..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <button style={styles.importBtn} onClick={handleImport} disabled={importing}>
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
        {importError && <p style={styles.errorText}>{importError}</p>}
      </div>

      <div style={styles.dividerRow}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or enter manually</span>
        <div style={styles.dividerLine} />
      </div>

      {/* TITLE */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Recipe title <span style={styles.required}>*</span>
        </label>
        <input
          style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
          type="text"
          placeholder="e.g. Brown Butter Pasta with Sage"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />
        {errors.title && <p style={styles.errorText}>{errors.title}</p>}
      </div>

      {/* EXTRA DESCRIPTION DROPDOWN */}
      <div style={styles.formGroup}>
        <button style={styles.extraToggle} onClick={() => setExtraOpen((v) => !v)}>
          <span style={styles.extraToggleLabel}>Extra description</span>
          <span style={styles.extraToggleChevron}>{extraOpen ? '▲' : '▼'}</span>
        </button>
        {extraOpen && (
          <div style={styles.extraPanel}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Short description <span style={styles.optional}>optional</span>
              </label>
              <textarea
                style={styles.textarea}
                rows={2}
                placeholder="A sentence or two about this dish..."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>

            <div style={styles.threeCol}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prep time <span style={styles.optional}>optional</span></label>
                <input style={styles.input} type="text" placeholder="e.g. 15 min"
                  value={form.prep_time} onChange={(e) => setField('prep_time', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cook time <span style={styles.optional}>optional</span></label>
                <input style={styles.input} type="text" placeholder="e.g. 30 min"
                  value={form.cook_time} onChange={(e) => setField('cook_time', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Serves <span style={styles.optional}>optional</span></label>
                <input style={styles.input} type="number" placeholder="4" min={1}
                  value={form.servings || ''} onChange={(e) => setField('servings', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div style={styles.twoCol}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tags <span style={styles.optional}>optional — comma separated</span></label>
                <input style={styles.input} type="text" placeholder="Italian, Pasta, Vegetarian"
                  value={form.tags.join(', ')} onChange={(e) => handleTagsChange(e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Visibility <span style={styles.optional}>optional</span></label>
                <select style={styles.input} value={form.is_public ? 'public' : 'private'}
                  onChange={(e) => setField('is_public', e.target.value === 'public')}>
                  <option value="private">Private — only me</option>
                  <option value="public">Public — anyone can view</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INGREDIENTS */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Ingredients <span style={styles.required}>*</span>
        </label>
        {/* Column headers */}
        <div style={styles.ingHeaderRow}>
          <span style={styles.colLabel}>Name</span>
          <span style={styles.colLabel}>Amount</span>
          <span style={styles.colLabel}>Unit</span>
          <span style={styles.colLabel}>Note <span style={styles.optional}>optional</span></span>
        </div>
        {form.ingredients.map((ing, i) => (
          <div key={i} style={styles.ingRow}>
            <input style={styles.input} placeholder="Ingredient name"
              value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} />
            <input style={styles.input} placeholder="e.g. 2"
              value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)} />
            <input style={styles.input} placeholder="e.g. cups"
              value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} />
            <input style={styles.input} placeholder="e.g. finely chopped"
              value={ing.note} onChange={(e) => updateIngredient(i, 'note', e.target.value)} />
            {form.ingredients.length > 1 && (
              <button style={styles.removeBtn} onClick={() => removeIngredient(i)} title="Remove">✕</button>
            )}
          </div>
        ))}
        {errors.ingredients && <p style={styles.errorText}>{errors.ingredients}</p>}
        <button style={styles.addRowBtn} onClick={addIngredient}>+ Add ingredient</button>
      </div>

      {/* STEPS */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Steps <span style={styles.optional}>optional</span>
        </label>
        {form.steps.map((step, i) => (
          <div key={i} style={styles.stepBlock}>
            <div style={styles.stepNum}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              {/* Two-column layout for basic + detail */}
              <div style={styles.stepCols}>
                <div>
                  <div style={styles.colLabel}>Quick step</div>
                  <textarea style={styles.textarea} rows={2}
                    placeholder="What to do..."
                    value={step.basic_instruction}
                    onChange={(e) => updateStep(i, 'basic_instruction', e.target.value)} />
                </div>
                <div>
                  <div style={styles.colLabel}>
                    Deep dive notes <span style={styles.optional}>optional</span>
                  </div>
                  <textarea
                    style={{ ...styles.textarea, borderColor: 'var(--gold)', opacity: 0.85 }}
                    rows={2}
                    placeholder="Technique, the 'why', tips..."
                    value={step.detail_instruction}
                    onChange={(e) => updateStep(i, 'detail_instruction', e.target.value)}
                  />
                </div>
              </div>
              {/* Optional tip line */}
              <input
                style={{ ...styles.input, marginTop: '0.4rem', fontSize: '0.82rem' }}
                placeholder="⚠ Optional tip callout (e.g. Watch closely — butter burns fast)"
                value={step.tip}
                onChange={(e) => updateStep(i, 'tip', e.target.value)}
              />
            </div>
            {form.steps.length > 1 && (
              <button style={{ ...styles.removeBtn, marginTop: '0.5rem' }} onClick={() => removeStep(i)}>✕</button>
            )}
          </div>
        ))}
        <button style={styles.addRowBtn} onClick={addStep}>+ Add step</button>
      </div>

      {/* SUBMIT */}
      <div style={styles.submitRow}>
        <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save recipe'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  importBox: {
    background: 'var(--warm-white)',
    border: '1.5px dashed var(--border)',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  importLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--rust)',
    marginBottom: '0.5rem',
  },
  importDesc: { fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '0.75rem', lineHeight: 1.5 },
  importRow: { display: 'flex', gap: '0.5rem' },
  urlInput: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.6rem 0.9rem',
    background: 'var(--cream)',
    color: 'var(--ink)',
    outline: 'none',
  },
  importBtn: {
    background: 'var(--rust)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.6rem 1.2rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border)' },
  dividerText: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', whiteSpace: 'nowrap' },
  formGroup: { marginBottom: '1.25rem' },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--ink-muted)',
    marginBottom: '0.5rem',
  },
  required: { color: 'var(--rust)', fontStyle: 'normal' },
  optional: { color: 'var(--ink-muted)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-body)', fontSize: '0.72rem' },
  input: {
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.65rem 0.9rem',
    background: 'var(--warm-white)',
    color: 'var(--ink)',
    outline: 'none',
  },
  inputError: { borderColor: 'var(--error)' },
  textarea: {
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.65rem 0.9rem',
    background: 'var(--warm-white)',
    color: 'var(--ink)',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
  },
  threeCol: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  ingHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 2fr 24px',
    gap: '0.5rem',
    marginBottom: '0.35rem',
    paddingRight: '32px',
  },
  colLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--ink-muted)',
    display: 'block',
    marginBottom: '0.25rem',
  },
  ingRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 24px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '0.25rem',
    lineHeight: 1,
  },
  addRowBtn: {
    background: 'none',
    border: '1px dashed var(--border)',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    color: 'var(--ink-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    width: '100%',
    marginTop: '0.25rem',
  },
  stepBlock: { display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' },
  stepNum: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--rust)',
    minWidth: '1.75rem',
    paddingTop: '0.5rem',
    textAlign: 'right',
  },
  stepCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  submitRow: { display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', marginTop: '1rem' },
  submitBtn: {
    background: 'var(--rust)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.7rem 2rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  errorText: { color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' },
  extraToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem 0.9rem', cursor: 'pointer', marginBottom: '0' },
  extraToggleLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-muted)' },
  extraToggleChevron: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-muted)' },
  extraPanel: { border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '1.25rem', marginBottom: '0.25rem' },
}
