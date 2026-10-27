import { getSupabaseClient } from '../supabaseClient.js'

async function requireUserId(client) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Niet ingelogd')
  return user.id
}

function withUserId(row, userId) {
  return { ...row, user_id: userId }
}

const ADJUSTMENTS_MIGRATION_HINT =
  'Voer supabase/migration_category_adjustments.sql uit in Supabase → SQL Editor (Dashboard eenmalige bedragen).'

function isAdjustmentsTableMissing(error) {
  return error?.code === 'PGRST205' && String(error?.message ?? '').includes('category_adjustments')
}

export function createSupabaseDb() {
  const client = getSupabaseClient()

  return {
    mode: 'supabase',
    client,
    async init() {
      const {
        data: { session },
      } = await client.auth.getSession()
      if (!session) return
    },
    async listAccounts() {
      const { data, error } = await client.from('accounts').select('*').order('name')
      if (error) throw error
      return data ?? []
    },
    async saveAccount(account) {
      const userId = await requireUserId(client)
      const { data, error } = await client
        .from('accounts')
        .upsert(withUserId(account, userId))
        .select()
        .single()
      if (error) throw error
      return data
    },
    async deleteAccount(id) {
      const { error } = await client.from('accounts').delete().eq('id', id)
      if (error) throw error
    },
    async listCategories() {
      const { data, error } = await client.from('categories').select('*').order('name')
      if (error) throw error
      return data ?? []
    },
    async saveCategory(cat) {
      const userId = await requireUserId(client)
      const { data, error } = await client
        .from('categories')
        .upsert(withUserId(cat, userId))
        .select()
        .single()
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
      const userId = await requireUserId(client)
      const { data, error } = await client
        .from('rules')
        .upsert(withUserId(rule, userId))
        .select()
        .single()
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
      const userId = await requireUserId(client)
      const payload = rows.map((row) => withUserId(row, userId))
      const { data, error } = await client
        .from('transactions')
        .upsert(payload, { onConflict: 'user_id,account_id,fingerprint', ignoreDuplicates: true })
        .select()
      if (error) throw error
      return { inserted: data?.length ?? 0, skipped: payload.length - (data?.length ?? 0) }
    },
    async updateTransaction(id, patch) {
      const { data, error } = await client.from('transactions').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    async replaceAllTransactions(transactions) {
      const userId = await requireUserId(client)
      const { error } = await client.from('transactions').delete().eq('user_id', userId)
      if (error) throw error
      if (transactions.length) {
        const payload = transactions.map((row) => withUserId(row, userId))
        const { error: insErr } = await client.from('transactions').insert(payload)
        if (insErr) throw insErr
      }
    },
    async listAdjustments() {
      const { data, error } = await client.from('category_adjustments').select('*').order('month', { ascending: false })
      if (error) {
        if (isAdjustmentsTableMissing(error)) return []
        throw error
      }
      return data ?? []
    },
    async saveAdjustment(adj) {
      const userId = await requireUserId(client)
      const { data, error } = await client
        .from('category_adjustments')
        .upsert(withUserId(adj, userId))
        .select()
        .single()
      if (error) {
        if (isAdjustmentsTableMissing(error)) throw new Error(ADJUSTMENTS_MIGRATION_HINT)
        throw error
      }
      return data
    },
    async deleteAdjustment(id) {
      const { error } = await client.from('category_adjustments').delete().eq('id', id)
      if (error) {
        if (isAdjustmentsTableMissing(error)) throw new Error(ADJUSTMENTS_MIGRATION_HINT)
        throw error
      }
    },
  }
}
