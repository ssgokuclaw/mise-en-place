import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the build tool — it compiles your TypeScript/React code into
// plain JavaScript that browsers understand, and runs a fast dev server.
export default defineConfig({
  plugins: [react()],
})
