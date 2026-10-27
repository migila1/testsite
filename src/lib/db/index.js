import { createDemoDb } from './demo.js'
import { createSupabaseDb } from './supabase.js'

export function createDb() {
  const demo =
    import.meta.env.VITE_DEMO === 'true' ||
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY

  if (demo) return createDemoDb()
  return createSupabaseDb()
}
