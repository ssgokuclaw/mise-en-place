// ============================================================
// types/index.ts — All TypeScript types for the app
// ============================================================
// TypeScript lets you define the "shape" of your data upfront.
// This catches bugs early: if you try to access recipe.titel
// instead of recipe.title, TypeScript will warn you immediately.
// These types mirror the database tables defined in supabase/schema.sql
// ============================================================

// A user account (from Supabase Auth — we don't store this ourselves)
export interface User {
  id: string;           // UUID from Supabase Auth
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// One ingredient line, e.g. "3 cloves garlic, minced"
export interface Ingredient {
  id?: string;          // UUID — optional because it's set by the DB on save
  recipe_id?: string;   // Which recipe this belongs to
  name: string;         // "garlic"
  amount: string;       // "3" — stored as string to handle "1/2", "a pinch", etc.
  unit: string;         // "cloves"
  note: string;         // "minced" or "European-style preferred"
  sort_order: number;   // Controls display order (1, 2, 3...)
}

// One step in the method
export interface Step {
  id?: string;
  recipe_id?: string;
  sort_order: number;
  // Quick view: the essential instruction in plain language
  basic_instruction: string;
  // Deep dive: technique notes, the "why", tips — optional
  detail_instruction: string;
  tip: string;          // Short callout tip, e.g. "Watch closely — butter burns fast"
}

// A complete recipe
export interface Recipe {
  id?: string;                  // UUID — set by DB on save
  user_id?: string;             // Who created it
  title: string;                // Required
  description: string;          // Short intro sentence — optional
  prep_time: string;            // "15 min" — stored as string for flexibility
  cook_time: string;            // "30 min"
  servings: number;             // Base serving count for scaling
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
  tags: string[];               // ["Italian", "Pasta", "Vegetarian"]
  is_public: boolean;           // Whether other users can see it
  source_url: string;           // If imported from a URL
  created_at?: string;          // Set by DB automatically
  updated_at?: string;          // Set by DB automatically

  // These are "joined" — they come from separate DB tables but we
  // fetch them together. They're optional because sometimes we only
  // fetch the recipe header without its ingredients/steps.
  ingredients?: Ingredient[];
  steps?: Step[];
}

// What the form looks like while the user is filling it in.
// Very similar to Recipe but all fields are optional during editing.
export type RecipeFormData = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[];
  steps: Omit<Step, 'id' | 'recipe_id'>[];
};

// The result from our URL import / AI parse function
export interface ParsedRecipe {
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  ingredients: { name: string; amount: string; unit: string; note: string }[];
  steps: { basic_instruction: string; detail_instruction: string }[];
}
