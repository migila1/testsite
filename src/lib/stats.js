/** Rapportages: geen excluded of interne overboekingen. */
export function filterForReports(transactions) {
  return transactions.filter((t) => !t.excluded && !t.is_internal_transfer)
}

/** @param {string[] | null | undefined} months YYYY-MM; leeg = geen filter */
export function filterByMonths(transactions, months) {
  const rows = filterForReports(transactions)
  if (!months?.length) return rows
  const set = new Set(months)
  return rows.filter((t) => set.has((t.booking_date ?? '').slice(0, 7)))
}

export function listYears(transactions) {
  const years = new Set()
  for (const tx of filterForReports(transactions)) {
    const y = (tx.booking_date ?? '').slice(0, 4)
    if (y) years.add(y)
  }
  return [...years].sort((a, b) => b.localeCompare(a))
}

export function monthsForYear(transactions, year) {
  const set = new Set()
  for (const tx of filterForReports(transactions)) {
    const m = (tx.booking_date ?? '').slice(0, 7)
    if (m.startsWith(`${year}-`)) set.add(m)
  }
  return [...set].sort()
}

/** @typedef {'expense' | 'income' | 'balance'} CategoryChartMode */

/**
 * @param {CategoryChartMode} mode
 * @param {Array} adjustments alleen bij mode expense
 */
export function sumByCategoryForMode(
  transactions,
  { mode = 'expense', months = null, adjustments = [] } = {},
) {
  const rows = filterByMonths(transactions, months)
  const map = new Map()

  for (const tx of rows) {
    const id = tx.category_id ?? '__geen__'
    const cents = tx.amount_cents ?? 0
    if (mode === 'expense') {
      if (cents >= 0) continue
      map.set(id, (map.get(id) ?? 0) + Math.abs(cents))
    } else if (mode === 'income') {
      if (cents <= 0) continue
      map.set(id, (map.get(id) ?? 0) + cents)
    } else {
      map.set(id, (map.get(id) ?? 0) + cents)
    }
  }

  if (mode === 'expense') {
    const monthSet = months?.length ? new Set(months) : null
    for (const adj of adjustments) {
      if (monthSet && !monthSet.has(adj.month)) continue
      const id = adj.category_id ?? '__geen__'
      map.set(id, (map.get(id) ?? 0) + Math.abs(adj.amount_cents ?? 0))
    }
  }

  const entries = [...map.entries()]
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .filter(({ totalCents }) => totalCents !== 0)

  if (mode === 'balance') {
    return entries.sort((a, b) => b.totalCents - a.totalCents)
  }
  return entries.sort((a, b) => b.totalCents - a.totalCents)
}

/** @deprecated alias — uitgaven per categorie */
export function sumByCategory(transactions, opts = {}) {
  return sumByCategoryForMode(transactions, { ...opts, mode: 'expense' })
}

export function monthlyTotals(transactions) {
  const rows = filterForReports(transactions)
  const map = new Map()
  for (const tx of rows) {
    const month = (tx.booking_date ?? '').slice(0, 7)
    if (!month) continue
    const prev = map.get(month) ?? { income: 0, expense: 0 }
    if (tx.amount_cents >= 0) prev.income += tx.amount_cents
    else prev.expense += Math.abs(tx.amount_cents)
    map.set(month, prev)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }))
}

export function periodIncomeExpense(transactions, { months = null, adjustments = [] } = {}) {
  const rows = filterByMonths(transactions, months)
  let income = 0
  let expense = 0
  for (const tx of rows) {
    if (tx.amount_cents >= 0) income += tx.amount_cents
    else expense += Math.abs(tx.amount_cents)
  }
  const monthSet = months?.length ? new Set(months) : null
  for (const adj of adjustments) {
    if (monthSet && !monthSet.has(adj.month)) continue
    expense += Math.abs(adj.amount_cents ?? 0)
  }
  return { income, expense }
}
