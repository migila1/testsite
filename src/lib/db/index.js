import { isDemoMode } from '../mode.js'
import { createDemoDb } from './demo.js'
import { createSupabaseDb } from './supabase.js'

export { isDemoMode } from '../mode.js'

export function createDb() {
  if (isDemoMode()) return createDemoDb()
  return createSupabaseDb()
}
