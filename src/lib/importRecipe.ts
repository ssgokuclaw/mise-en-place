// ============================================================
// lib/importRecipe.ts — URL import via Claude AI
// ============================================================
// This function:
//   1. Fetches the HTML from a recipe URL (via a CORS proxy)
//   2. Sends the raw HTML to Claude with a prompt to extract
//      the recipe in structured JSON format
//   3. Returns a ParsedRecipe object ready to populate the form
//
// NOTE ON SECURITY: In this prototype, the Anthropic API key
// is used client-side (in the browser). This is fine for personal
// use or development, but in production you'd move this to a
// Vercel serverless function so the key stays secret.
// See: vercel/api/import-recipe.ts (included in this project)
// ============================================================

import type { ParsedRecipe } from '../types'

// ============================================================
// Main import function — call this from the Add Recipe form
// ============================================================
export async function importRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string

  if (!apiKey) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY in .env.local')
  }

  // Step 1: Fetch the webpage HTML
  // We use a public CORS proxy because browsers block direct
  // cross-origin requests. In production, use your own serverless function.
  let htmlContent: string
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    const data = await response.json() as { contents: string }
    htmlContent = data.contents
  } catch {
    throw new Error('Could not fetch that URL. Make sure it\'s a public recipe page.')
  }

  // Step 2: Strip the HTML down to just the text content
  // We don't want to send thousands of tokens of HTML tags to Claude —
  // just the visible text is enough to extract a recipe.
  const textContent = stripHtml(htmlContent).slice(0, 8000) // Limit to ~8k chars

  // Step 3: Ask Claude to extract the recipe as structured JSON
  const prompt = `You are a recipe extraction assistant. Extract the recipe from the following webpage text and return it as JSON only — no markdown, no explanation, just the raw JSON object.

The JSON must match this exact structure:
{
  "title": "Recipe name",
  "description": "One or two sentence description",
  "prep_time": "e.g. 15 min",
  "cook_time": "e.g. 30 min",
  "servings": 4,
  "ingredients": [
    { "name": "ingredient name", "amount": "1", "unit": "cup", "note": "optional note like 'finely chopped'" }
  ],
  "steps": [
    {
      "basic_instruction": "Short, clear instruction for the step",
      "detail_instruction": "Detailed technique notes, the 'why' behind the step, tips for success"
    }
  ]
}

Rules:
- If a field isn't found, use an empty string or 0 for numbers
- Split combined steps into separate step objects
- For basic_instruction: be concise (1-2 sentences max)
- For detail_instruction: add helpful technique notes even if not in the original
- Return ONLY the JSON, nothing else

Webpage text:
${textContent}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // This header is required when calling the API from a browser
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json() as { error?: { message?: string } }
    throw new Error(`Claude API error: ${err.error?.message ?? response.statusText}`)
  }

  const data = await response.json() as {
    content: { type: string; text: string }[]
  }

  // Step 4: Parse the JSON response
  const text = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  try {
    // Remove any accidental markdown code fences Claude might add
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as ParsedRecipe
    return parsed
  } catch {
    throw new Error('Could not parse the recipe. Try a different URL or enter manually.')
  }
}

// ============================================================
// Helper: strip HTML tags, leaving just readable text
// ============================================================
function stripHtml(html: string): string {
  // Remove script and style blocks entirely (we don't want JS or CSS text)
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  // Replace block-level tags with newlines so paragraphs don't run together
  text = text.replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}
