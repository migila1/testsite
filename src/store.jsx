import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createDb } from './lib/db/index.js'
import { applyRules } from './lib/rules.js'
import { computeFingerprint, fingerprintBaseKey } from './lib/fingerprint.js'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const db = useMemo(() => createDb(), [])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [rules, setRules] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [a, c, r, t] = await Promise.all([
        db.listAccounts(),
        db.listCategories(),
        db.listRules(),
        db.listTransactions(),
      ])
      setAccounts(a)
      setCategories(c)
      setRules(r)
      setTransactions(t)
      setError(null)
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await db.init()
        if (!cancelled) {
          setReady(true)
          await refresh()
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [db, refresh])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const saveCategory = async (cat) => {
    await db.saveCategory(cat)
    await refresh()
  }

  const deleteCategory = async (id) => {
    await db.deleteCategory(id)
    await refresh()
  }

  const saveAccount = async (acc) => {
    await db.saveAccount(acc)
    await refresh()
  }

  const deleteAccount = async (id) => {
    await db.deleteAccount(id)
    await refresh()
  }

  const saveRule = async (rule) => {
    await db.saveRule(rule)
    const nextRules = [...rules.filter((r) => r.id !== rule.id), rule]
    const updated = applyRules(transactions, nextRules)
    await db.replaceAllTransactions(updated)
    await refresh()
  }

  const deleteRule = async (id) => {
    await db.deleteRule(id)
    await refresh()
  }

  const updateTransaction = async (id, patch) => {
    await db.updateTransaction(id, patch)
    await refresh()
  }

  const importRows = async (accountId, parsedRows) => {
    const existing = await db.listTransactions()
    const baseCounts = new Map()
    for (const t of existing) {
      if (t.account_id !== accountId) continue
      const key = fingerprintBaseKey({
        accountId: t.account_id,
        bookingDate: t.booking_date,
        amountCents: t.amount_cents,
        description: t.description,
        counterpartyIban: t.counterparty_iban,
      })
      baseCounts.set(key, (baseCounts.get(key) ?? 0) + 1)
    }

    const prepared = []
    for (const row of parsedRows) {
      const baseKey = fingerprintBaseKey({
        accountId,
        bookingDate: row.booking_date,
        amountCents: row.amount_cents,
        description: row.description,
        counterpartyIban: row.counterparty_iban,
      })
      const occ = baseCounts.get(baseKey) ?? 0
      baseCounts.set(baseKey, occ + 1)
      const fingerprint = await computeFingerprint(
        {
          accountId,
          bookingDate: row.booking_date,
          amountCents: row.amount_cents,
          description: row.description,
          counterpartyIban: row.counterparty_iban,
        },
        occ,
      )
      prepared.push({
        account_id: accountId,
        booking_date: row.booking_date,
        description: row.description,
        counterparty_name: row.counterparty_name,
        counterparty_iban: row.counterparty_iban,
        amount_cents: row.amount_cents,
        mutation_type: row.mutation_type,
        memo: row.memo,
        fingerprint,
        category_id: null,
        category_source: null,
        excluded: false,
        is_internal_transfer: false,
      })
    }

    const withRules = applyRules(prepared, rules)
    return db.upsertTransactions(withRules)
  }

  const reapplyRules = async () => {
    const updated = applyRules(transactions, rules)
    await db.replaceAllTransactions(updated)
    await refresh()
  }

  const value = {
    db,
    ready,
    loading,
    error,
    accounts,
    categories,
    rules,
    transactions,
    categoryById,
    refresh,
    saveCategory,
    deleteCategory,
    saveAccount,
    deleteAccount,
    saveRule,
    deleteRule,
    updateTransaction,
    importRows,
    reapplyRules,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore buiten StoreProvider')
  return ctx
}
