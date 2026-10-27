import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from './mode.js'

let client

export function getSupabaseClient() {
  if (isDemoMode()) return null
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase URL en anon key zijn vereist')
  }
  client = createClient(url, key)
  return client
}
