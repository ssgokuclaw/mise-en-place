// ============================================================
// components/RecipeCard.tsx
// ============================================================
// A card displayed in the recipe grid on the home page.
// Props: the recipe data and a callback when the card is clicked.
// ============================================================

import { Link } from 'react-router-dom'
import type { Recipe } from '../types'

// "Props" are the inputs to a component — like function arguments.
// Here we define exactly what data RecipeCard needs.
interface RecipeCardProps {
  recipe: Recipe
}

// A simple lookup to give each cuisine a background colour
const CUISINE_COLORS: Record<string, string> = {
  Italian:    'linear-gradient(135deg, #F5E6D3, #EDD5B8)',
  Asian:      'linear-gradient(135deg, #D4E8F0, #C0D8E8)',
  Mexican:    'linear-gradient(135deg, #F5E6C8, #EDD5A8)',
  French:     'linear-gradient(135deg, #E8D4E8, #D8C0D8)',
  American:   'linear-gradient(135deg, #D4E8D8, #C0D4C4)',
  default:    'linear-gradient(135deg, #E8D5C4, #D4C4B0)',
}

// A fallback emoji if no cuisine is recognised
const CUISINE_EMOJI: Record<string, string> = {
  Italian: '🍝', Asian: '🍜', Mexican: '🌮',
  French: '🥐', American: '🍔', default: '🍽️',
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  // Pick the first tag as the "cuisine" for colour/emoji
  const primaryTag = recipe.tags?.[0] ?? 'default'
  const bg = CUISINE_COLORS[primaryTag] ?? CUISINE_COLORS.default
  const emoji = CUISINE_EMOJI[primaryTag] ?? CUISINE_EMOJI.default

  return (
    // Link wraps the whole card — clicking anywhere navigates to the recipe
    <Link to={`/recipe/${recipe.id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        {/* Coloured header area with emoji */}
        <div style={{ ...styles.cardImage, background: bg }}>
          <span style={{ fontSize: '2.5rem' }}>{emoji}</span>
        </div>

        <div style={styles.cardBody}>
          <div style={styles.cardTitle}>{recipe.title}</div>

          {/* Tags row */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{ marginBottom: '0.4rem' }}>
              {recipe.tags.slice(0, 3).map((tag) => (
                <span key={tag} style={styles.tag}>{tag}</span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div style={styles.meta}>
            {recipe.cook_time && (
              <span style={styles.metaItem}>⏱ {recipe.cook_time}</span>
            )}
            {recipe.difficulty && (
              <span style={styles.metaItem}>· {recipe.difficulty}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--warm-white)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardImage: {
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '1rem 1.1rem 1.1rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--ink)',
    marginBottom: '0.35rem',
    lineHeight: 1.3,
  },
  tag: {
    display: 'inline-block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: 'var(--cream)',
    color: 'var(--ink-muted)',
    borderRadius: '3px',
    padding: '0.2rem 0.5rem',
    marginRight: '0.3rem',
  },
  meta: { display: 'flex', gap: '0.5rem', marginTop: '0.4rem' },
  metaItem: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--ink-muted)',
  },
}
