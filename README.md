# mise en place 🍽️

> Your recipes. Nothing else.

A clean, ad-free recipe app. No life stories, no pop-ups, no ads — just ingredients and steps. Built with React, TypeScript, Supabase, and deployed on Vercel.

---

## Features

- **Two recipe views** — Quick View (essentials only) and Deep Dive (technique notes, tips, the "why")
- **URL import** — paste any recipe URL and AI strips it down to just the recipe
- **Servings scaler** — ingredient amounts adjust automatically
- **Auth** — email/password or Google login
- **Private by default** — your recipes are yours unless you make them public

---

## Tech Stack

| Layer      | Tool |
|------------|------|
| Frontend   | React 18 + TypeScript |
| Build tool | Vite |
| Routing    | React Router v6 |
| Database   | Supabase (PostgreSQL) |
| Auth       | Supabase Auth |
| AI import  | Anthropic Claude API |
| Hosting    | Vercel |

---

## Setup (step by step)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd mise-en-place
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once it's ready, go to **SQL Editor** in the left sidebar
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. Go to **Project Settings → API** and copy:
   - **Project URL** → your `VITE_SUPABASE_URL`
   - **anon / public key** → your `VITE_SUPABASE_ANON_KEY`

### 3. Set up Google Login (optional)

If you want Google sign-in:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials**
3. Create an **OAuth 2.0 Client ID** (Web application)
4. Add this as an Authorized redirect URI:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client Secret**
6. In Supabase: **Authentication → Providers → Google** → paste them in

### 4. Get your Anthropic API key (for URL import)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it for the next step

> ⚠️ **Security note:** In this setup the Anthropic key is used in the browser, which is fine for personal use. For a public app, move the import function to a Vercel serverless function so the key stays server-side.

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push your code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In the Vercel project settings, add your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
4. Deploy — Vercel auto-deploys on every `git push`

### One extra Supabase step for production

In Supabase → **Authentication → URL Configuration**, add your Vercel URL to:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app`

---

## Project Structure

```
mise-en-place/
├── supabase/
│   └── schema.sql          # Run this once in Supabase SQL editor
├── src/
│   ├── components/
│   │   ├── Nav.tsx          # Top navigation bar
│   │   ├── RecipeCard.tsx   # Card shown in the recipe grid
│   │   └── RecipeForm.tsx   # Shared add/edit form with URL import
│   ├── hooks/
│   │   └── useAuth.tsx      # Auth context — provides user everywhere
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client setup
│   │   ├── recipes.ts       # All database operations
│   │   └── importRecipe.ts  # Claude-powered URL import
│   ├── pages/
│   │   ├── AuthPage.tsx     # Login / signup
│   │   ├── HomePage.tsx     # Recipe dashboard
│   │   ├── RecipePage.tsx   # Single recipe with Quick/Deep Dive
│   │   └── RecipePages.tsx  # Add + Edit pages
│   ├── styles/
│   │   └── global.css       # Global CSS variables and base styles
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── App.tsx              # Route definitions
│   └── main.tsx             # App entry point
├── .env.example             # Copy to .env.local and fill in
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Common issues

**"Missing Supabase env vars"** — Make sure you created `.env.local` (not just `.env`) and restarted the dev server.

**Google login not working** — Double-check the redirect URI in Google Cloud Console matches exactly: `https://<project-id>.supabase.co/auth/v1/callback`

**URL import fails** — The CORS proxy (`allorigins.win`) is a free service and can be slow. Some sites also block scraping. If it fails, enter the recipe manually.

**Recipe not saving** — Check the Supabase SQL editor logs. If you see "RLS policy violation", make sure you ran the full `schema.sql` including the policy section.
