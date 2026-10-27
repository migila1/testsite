import { fingerprintBaseKey } from '../fingerprint.js'

/** Controleer unieke sleutels per account (zelfde als DB-index). */
export function findDuplicateKeys(transactions) {
  const seen = new Map()
  const dupes = []
  for (const tx of transactions) {
    const key = `${tx.account_id}:${tx.fingerprint ?? fingerprintBaseKey({
      accountId: tx.account_id,
      bookingDate: tx.booking_date,
      amountCents: tx.amount_cents,
      description: tx.description,
      counterpartyIban: tx.counterparty_iban,
    })}`
    if (seen.has(key)) dupes.push({ key, ids: [seen.get(key), tx.id] })
    else seen.set(key, tx.id)
  }
  return dupes
}
