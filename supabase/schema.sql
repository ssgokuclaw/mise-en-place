-- ============================================================
-- supabase/schema.sql
-- ============================================================
-- Run this entire file in your Supabase project's SQL editor:
--   1. Go to https://supabase.com → your project
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
--
-- This creates all the tables, sets up security rules, and
-- enables Google login.
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

-- recipes table: one row per recipe
CREATE TABLE IF NOT EXISTS recipes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prep_time   TEXT NOT NULL DEFAULT '',
  cook_time   TEXT NOT NULL DEFAULT '',
  servings    INTEGER NOT NULL DEFAULT 4,
  difficulty  TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',   -- array of strings
  is_public   BOOLEAN NOT NULL DEFAULT false,
  source_url  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ingredients table: many rows per recipe
CREATE TABLE IF NOT EXISTS ingredients (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  amount      TEXT NOT NULL DEFAULT '',
  unit        TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- steps table: many rows per recipe
CREATE TABLE IF NOT EXISTS steps (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id           UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  basic_instruction   TEXT NOT NULL DEFAULT '',
  detail_instruction  TEXT NOT NULL DEFAULT '',
  tip                 TEXT NOT NULL DEFAULT ''
);


-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
-- This function runs automatically whenever a recipe row is updated,
-- keeping the updated_at timestamp accurate without manual effort.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Supabase uses RLS to control who can read/write each row.
-- Without these policies, NO ONE can access the data (it's locked
-- by default when RLS is enabled). We define exactly who gets
-- access to what.

ALTER TABLE recipes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps       ENABLE ROW LEVEL SECURITY;

-- RECIPES policies --

-- Anyone can read public recipes
CREATE POLICY "Public recipes are viewable by everyone"
  ON recipes FOR SELECT
  USING (is_public = true);

-- A logged-in user can read their own recipes (public or private)
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

-- A logged-in user can create recipes (they become the owner)
CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user can only update their own recipes
CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

-- A user can only delete their own recipes
CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);


-- INGREDIENTS policies --
-- Ingredients belong to a recipe, so we check ownership via the recipe

CREATE POLICY "Ingredients viewable if recipe is viewable"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage ingredients of their recipes"
  ON ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );


-- STEPS policies --

CREATE POLICY "Steps viewable if recipe is viewable"
  ON steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
        AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage steps of their recipes"
  ON steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = steps.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );


-- ============================================================
-- GOOGLE AUTH SETUP (do this in the Supabase dashboard UI)
-- ============================================================
-- You can't enable Google auth via SQL — do it in the UI:
--   1. Supabase dashboard → Authentication → Providers
--   2. Enable "Google"
--   3. You'll need a Google OAuth client ID and secret:
--      a. Go to https://console.cloud.google.com
--      b. Create a project → APIs & Services → Credentials
--      c. Create OAuth 2.0 Client ID (Web application)
--      d. Add authorized redirect URI:
--         https://[your-project].supabase.co/auth/v1/callback
--   4. Paste the Client ID and Secret into Supabase
-- ============================================================
