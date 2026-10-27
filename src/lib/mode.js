export function isDemoMode() {
  return (
    import.meta.env.VITE_DEMO === 'true' ||
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}
