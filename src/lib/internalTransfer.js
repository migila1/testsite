export function normalizeIban(iban) {
  return String(iban ?? '')
    .replace(/\s/g, '')
    .toUpperCase()
}

/** Tegenrekening is een eigen IBAN → interne overboeking. */
export function markInternalTransfersByIban(transactions, accounts) {
  const ownIbans = new Map()
  for (const a of accounts) {
    const n = normalizeIban(a.iban)
    if (n) ownIbans.set(n, a.id)
  }

  return transactions.map((tx) => {
    if (tx.is_internal_transfer) return tx
    const cp = normalizeIban(tx.counterparty_iban)
    if (!cp) return tx
    const ownerAccountId = ownIbans.get(cp)
    if (ownerAccountId && ownerAccountId !== tx.account_id) {
      return { ...tx, is_internal_transfer: true }
    }
    return tx
  })
}

/**
 * Koppelt tegengestelde bedragen tussen twee eigen rekeningen (zelfde dag ±3 dagen).
 */
export function markInternalTransferPairs(transactions, accounts) {
  if (accounts.length < 2) return transactions

  const accountIds = new Set(accounts.map((a) => a.id))
  const out = transactions.map((t) => ({ ...t }))
  const used = new Set()

  for (let i = 0; i < out.length; i++) {
    if (used.has(i) || out[i].is_internal_transfer) continue
    const a = out[i]
    if (!accountIds.has(a.account_id)) continue

    for (let j = i + 1; j < out.length; j++) {
      if (used.has(j) || out[j].is_internal_transfer) continue
      const b = out[j]
      if (a.account_id === b.account_id) continue
      if (!accountIds.has(b.account_id)) continue
      if (a.amount_cents + b.amount_cents !== 0) continue

      const dayDiff = Math.abs(daysBetween(a.booking_date, b.booking_date))
      if (dayDiff > 3) continue

      out[i] = { ...out[i], is_internal_transfer: true }
      out[j] = { ...out[j], is_internal_transfer: true }
      used.add(i)
      used.add(j)
      break
    }
  }
  return out
}

function daysBetween(d1, d2) {
  if (!d1 || !d2) return 999
  const a = new Date(d1)
  const b = new Date(d2)
  return Math.round((a - b) / (86400000))
}

export function applyInternalTransferDetection(transactions, accounts) {
  let rows = markInternalTransfersByIban(transactions, accounts)
  rows = markInternalTransferPairs(rows, accounts)
  return rows
}
