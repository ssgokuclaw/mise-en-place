// ============================================================
// lib/recipes.ts — All database operations for recipes
// ============================================================
// Keeping all DB queries in one file means:
//   - Your components stay clean (no raw SQL scattered everywhere)
//   - If Supabase changes their API, you only update one file
//   - Easier to debug — all data fetching is in one place
// ============================================================

import { supabase } from './supabase'
import type { Recipe, RecipeFormData } from '../types'

// ============================================================
// FETCH all recipes for the currently logged-in user
// ============================================================
export async function getMyRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')                          // Select all columns
    .order('created_at', { ascending: false })  // Newest first

  if (error) throw error
  return data as Recipe[]
}

// ============================================================
// FETCH a single recipe with its ingredients and steps
// ============================================================
export async function getRecipe(id: string): Promise<Recipe> {
  // Fetch the recipe row
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)      // .eq() means "WHERE id = ?"
    .single()          // We expect exactly one row

  if (recipeError) throw recipeError

  // Fetch ingredients for this recipe, in display order
  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', id)
    .order('sort_order', { ascending: true })

  if (ingError) throw ingError

  // Fetch steps for this recipe, in display order
  const { data: steps, error: stepsError } = await supabase
    .from('steps')
    .select('*')
    .eq('recipe_id', id)
    .order('sort_order', { ascending: true })

  if (stepsError) throw stepsError

  // Combine everything into one object
  return { ...recipe, ingredients, steps } as Recipe
}

// ============================================================
// CREATE a new recipe
// ============================================================
// This is a multi-step operation:
//   1. Insert the recipe header row
//   2. Insert all ingredient rows
//   3. Insert all step rows
// We do them in sequence because ingredients/steps need the
// recipe's ID (which the DB generates in step 1).
export async function createRecipe(
  formData: RecipeFormData,
  userId: string
): Promise<string> {
  // Step 1: Insert the recipe (without ingredients/steps)
  const { ingredients, steps, ...recipeData } = formData

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({ ...recipeData, user_id: userId })
    .select()   // Return the newly created row (so we get the generated ID)
    .single()

  if (recipeError) throw recipeError
  const recipeId = recipe.id

  // Step 2: Insert ingredients (only if there are any)
  if (ingredients.length > 0) {
    const ingredientRows = ingredients.map((ing, index) => ({
      ...ing,
      name: ing.name.trim().toLowerCase(),
      recipe_id: recipeId,
      sort_order: index,   // Preserve the order the user entered them
    }))

    const { error: ingError } = await supabase
      .from('ingredients')
      .insert(ingredientRows)

    if (ingError) throw ingError
  }

  // Step 3: Insert steps (only if there are any)
  if (steps.length > 0) {
    const stepRows = steps.map((step, index) => ({
      ...step,
      recipe_id: recipeId,
      sort_order: index,
    }))

    const { error: stepsError } = await supabase
      .from('steps')
      .insert(stepRows)

    if (stepsError) throw stepsError
  }

  return recipeId
}

// ============================================================
// UPDATE an existing recipe
// ============================================================
// Strategy: delete old ingredients/steps, insert new ones.
// This is simpler than diffing what changed. For a recipe app
// with small lists, the performance difference is negligible.
export async function updateRecipe(
  id: string,
  formData: RecipeFormData
): Promise<void> {
  const { ingredients, steps, ...recipeData } = formData

  // Update the recipe header
  const { error: recipeError } = await supabase
    .from('recipes')
    .update(recipeData)
    .eq('id', id)

  if (recipeError) throw recipeError

  // Delete existing ingredients and re-insert
  await supabase.from('ingredients').delete().eq('recipe_id', id)

  if (ingredients.length > 0) {
    const ingredientRows = ingredients.map((ing, index) => ({
      ...ing,
      name: ing.name.trim().toLowerCase(),
      recipe_id: id,
      sort_order: index,
    }))
    const { error } = await supabase.from('ingredients').insert(ingredientRows)
    if (error) throw error
  }

  // Delete existing steps and re-insert
  await supabase.from('steps').delete().eq('recipe_id', id)

  if (steps.length > 0) {
    const stepRows = steps.map((step, index) => ({
      ...step,
      recipe_id: id,
      sort_order: index,
    }))
    const { error } = await supabase.from('steps').insert(stepRows)
    if (error) throw error
  }
}

// ============================================================
// DELETE a recipe
// ============================================================
// Because we set ON DELETE CASCADE in schema.sql, deleting
// the recipe automatically deletes its ingredients and steps.
export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================
// FETCH all distinct ingredient names (for the search page)
// ============================================================
export async function getIngredientNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('name')

  if (error) throw error
  const unique = Array.from(new Set((data as { name: string }[]).map((r) => r.name))).sort()
  return unique
}

// ============================================================
// SEARCH recipes that contain ALL of the given ingredients
// ============================================================
// Uses an RPC function defined in Supabase (see schema.sql).
// Returns full recipe objects for display.
export async function searchRecipesByIngredients(names: string[]): Promise<Recipe[]> {
  const { data, error } = await supabase.rpc('recipes_with_all_ingredients', {
    ing_names: names,
  })

  if (error) throw error
  const ids = (data as { id: string }[]).map((r) => r.id)
  if (ids.length === 0) return []

  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (recipesError) throw recipesError
  return recipes as Recipe[]
}

// ============================================================
// FETCH public recipes (for the browse page)
// ============================================================
export async function getPublicRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Recipe[]
}
