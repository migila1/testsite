import { createClient } from '@supabase/supabase-js'

export function createSupabaseDb() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase URL en anon key zijn vereist')
  }

	console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
	console.log('Supabase key aanwezig:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

  const client = createClient(url, key)

  return {
    mode: 'supabase',
    client,
    async init() {
      const { data: { session } } = await client.auth.getSession()
      if (!session) {
        const email = import.meta.env.VITE_DEV_EMAIL
        const password = import.meta.env.VITE_DEV_PASSWORD
        if (email && password) {
          await client.auth.signInWithPassword({ email, password })
        }
      }
    },
    async listAccounts() {
      const { data, error } = await client.from('accounts').select('*').order('name')
      if (error) throw error
      return data ?? []
    },
    async saveAccount(account) {
      const { data, error } = await client.from('accounts').upsert(account).select().single()
      if (error) throw error
      return data
    },
    async deleteAccount(id) {
      const { error } = await client.from('accounts').delete().eq('id', id)
      if (error) throw error
    },
    async listCategories() {
      const { data, error } = await client.from('categories').select('*').order('sort_order')
      if (error) throw error
      return data ?? []
    },
    async saveCategory(cat) {
      const { data, error } = await client.from('categories').upsert(cat).select().single()
      if (error) throw error
      return data
    },
    async deleteCategory(id) {
      const { error } = await client.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    async listRules() {
      const { data, error } = await client.from('rules').select('*').order('priority')
      if (error) throw error
      return data ?? []
    },
    async saveRule(rule) {
      const { data, error } = await client.from('rules').upsert(rule).select().single()
      if (error) throw error
      return data
    },
    async deleteRule(id) {
      const { error } = await client.from('rules').delete().eq('id', id)
      if (error) throw error
    },
    async listTransactions() {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('booking_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    async upsertTransactions(rows) {
      const { data, error } = await client
        .from('transactions')
        .upsert(rows, { onConflict: 'user_id,account_id,fingerprint', ignoreDuplicates: true })
        .select()
      if (error) throw error
      return { inserted: data?.length ?? 0, skipped: rows.length - (data?.length ?? 0) }
    },
    async updateTransaction(id, patch) {
      const { data, error } = await client.from('transactions').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    async replaceAllTransactions(transactions) {
      const { error } = await client.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      if (transactions.length) {
        const { error: insErr } = await client.from('transactions').insert(transactions)
        if (insErr) throw insErr
      }
    },
  }
}
