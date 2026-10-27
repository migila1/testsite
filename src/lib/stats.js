/** Rapportages: geen excluded of interne overboekingen. */
export function filterForReports(transactions) {
  return transactions.filter((t) => !t.excluded && !t.is_internal_transfer)
}

/** @param {Array} transactions centen, negatief = uitgave */
export function sumByCategory(transactions) {
  const rows = filterForReports(transactions)
  const map = new Map()
  for (const tx of rows) {
    if (tx.amount_cents >= 0) continue
    const id = tx.category_id ?? '__geen__'
    map.set(id, (map.get(id) ?? 0) + Math.abs(tx.amount_cents))
  }
  return [...map.entries()].map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
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
