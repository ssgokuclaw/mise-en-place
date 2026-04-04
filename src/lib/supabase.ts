// ============================================================
// lib/supabase.ts — Supabase client setup
// ============================================================
// This file creates a single Supabase client that we reuse
// everywhere. Think of it as the "connection" to your database
// and auth system.
//
// import { supabase } from '../lib/supabase'
// ============================================================

import { createClient } from '@supabase/supabase-js'

// These come from your .env.local file.
// Vite exposes env variables that start with VITE_ to the browser.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Helpful error if you forgot to set up the .env.local file
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.'
  )
}

// createClient returns an object with methods for auth, database queries, etc.
// The "anon" key is safe to expose in the browser — Supabase's Row Level Security
// policies (defined in schema.sql) control what each user can actually access.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
