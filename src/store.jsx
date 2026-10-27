import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth.jsx'
import { createDb } from './lib/db/index.js'
import { enrichTransaction, enrichmentPatch } from './lib/enrichTransaction.js'
import { applyInternalTransferDetection } from './lib/internalTransfer.js'
import { buildLearnedRuleUpsert, normalizePattern, suggestPatternFromTransaction } from './lib/learnRule.js'
import { applyRules } from './lib/rules.js'
import { computeFingerprint, fingerprintBaseKey } from './lib/fingerprint.js'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { authRequired, user, authReady } = useAuth()
  const db = useMemo(() => createDb(), [])
  const canLoad = authReady && (!authRequired || user)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [rules, setRules] = useState([])
  const [transactions, setTransactions] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [a, c, r, t, adj] = await Promise.all([
        db.listAccounts(),
        db.listCategories(),
        db.listRules(),
        db.listTransactions(),
        db.listAdjustments?.() ?? Promise.resolve([]),
      ])
      setAccounts(a)
      setCategories(c)
      setRules(r)
      let enrichedList = t
      const persistPatches = []
      for (const tx of t) {
        const enriched = enrichTransaction(tx)
        const patch = enrichmentPatch(tx, enriched)
        if (Object.keys(patch).length) persistPatches.push({ id: tx.id, patch })
      }
      for (const { id, patch } of persistPatches) {
        await db.updateTransaction(id, patch)
      }
      if (persistPatches.length) {
        enrichedList = await db.listTransactions()
      }
      setTransactions(enrichedList)
      setAdjustments(adj)
      setError(null)
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => {
    if (!canLoad) {
      setReady(false)
      setAccounts([])
      setCategories([])
      setRules([])
      setTransactions([])
      setAdjustments([])
      setLoading(false)
      return undefined
    }
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
  }, [db, refresh, canLoad])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const saveCategory = async (cat) => {
    const saved = await db.saveCategory(cat)
    await refresh()
    return saved
  }

  const deleteCategory = async (id) => {
    await db.deleteCategory(id)
    await refresh()
  }

  const saveAccount = async (acc) => {
    await db.saveAccount(acc)
    await syncInternalTransfers()
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

  /** Handmatige categorie + optionele leerregel (meerdere woorden in één regel). */
  const assignManualCategory = async (txId, categoryId, { learnPattern = '', learnEnabled = true } = {}) => {
    const tx = transactions.find((t) => t.id === txId)
    await db.updateTransaction(txId, {
      category_id: categoryId || null,
      category_source: categoryId ? 'manual' : null,
    })

    if (learnEnabled && categoryId && tx) {
      const pattern = normalizePattern(learnPattern) || suggestPatternFromTransaction(tx)
      const currentRules = await db.listRules()
      const upsert = buildLearnedRuleUpsert(currentRules, { pattern, category_id: categoryId })
      if (upsert) {
        const savedRule = await db.saveRule(upsert.rule)
        const currentTxs = await db.listTransactions()
        const nextRules = [...currentRules.filter((r) => r.id !== savedRule.id), savedRule]
        const updated = applyRules(currentTxs, nextRules)
        await db.replaceAllTransactions(updated)
      }
    }
    await refresh()
  }

  const assignManualCategoryBulk = async (txIds, categoryId) => {
    const ids = [...new Set(txIds)].filter(Boolean)
    if (!ids.length) return
    for (const txId of ids) {
      await db.updateTransaction(txId, {
        category_id: categoryId || null,
        category_source: categoryId ? 'manual' : null,
      })
    }
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
      const enriched = enrichTransaction({
        account_id: accountId,
        booking_date: row.booking_date,
        description: row.description,
        counterparty_name: row.counterparty_name,
        counterparty_iban: row.counterparty_iban,
        amount_cents: row.amount_cents,
        mutation_type: row.mutation_type,
        memo: row.memo,
        booking_time: row.booking_time || null,
      })

      prepared.push({
        ...enriched,
        fingerprint,
        category_id: null,
        category_source: null,
        excluded: false,
        is_internal_transfer: false,
      })
    }

    const withRules = applyRules(prepared, rules)
    const result = await db.upsertTransactions(withRules)
    await syncInternalTransfers()
    return result
  }

  const syncInternalTransfers = async () => {
    const [allTx, accs] = await Promise.all([db.listTransactions(), db.listAccounts()])
    if (accs.length < 2 && !accs.some((a) => a.iban)) return
    const marked = applyInternalTransferDetection(allTx, accs)
    const prevById = new Map(allTx.map((t) => [t.id, t]))
    let any = false
    for (const tx of marked) {
      const prev = prevById.get(tx.id)
      if (prev && prev.is_internal_transfer !== tx.is_internal_transfer) {
        await db.updateTransaction(tx.id, { is_internal_transfer: tx.is_internal_transfer })
        any = true
      }
    }
    if (any) await refresh()
  }

  const reapplyRules = async () => {
    const updated = applyRules(transactions, rules)
    await db.replaceAllTransactions(updated)
    await refresh()
  }

  const saveAdjustment = async (adj) => {
    if (!db.saveAdjustment) return
    await db.saveAdjustment(adj)
    await refresh()
  }

  const deleteAdjustment = async (id) => {
    if (!db.deleteAdjustment) return
    await db.deleteAdjustment(id)
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
    adjustments,
    categoryById,
    refresh,
    saveCategory,
    deleteCategory,
    saveAccount,
    deleteAccount,
    saveRule,
    deleteRule,
    updateTransaction,
    assignManualCategory,
    assignManualCategoryBulk,
    importRows,
    reapplyRules,
    saveAdjustment,
    deleteAdjustment,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore buiten StoreProvider')
  return ctx
}
