import { sha256Hex } from './hash.js'

function normalizePart(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Basisstring voor dedupe (zonder voorkomensindex). */
export function fingerprintBaseKey({ accountId, bookingDate, amountCents, description, counterpartyIban }) {
  return [
    normalizePart(accountId),
    normalizePart(bookingDate),
    String(amountCents ?? 0),
    normalizePart(description),
    normalizePart(counterpartyIban),
  ].join('|')
}

/**
 * @param {object} tx velden voor base key
 * @param {number} occurrenceIndex 0-based binnen dezelfde base key
 */
export async function computeFingerprint(tx, occurrenceIndex = 0) {
  const base = fingerprintBaseKey(tx)
  return sha256Hex(`${base}#${occurrenceIndex}`)
}

/** Tel voorkomens per base key in een lijst (voor import-batch). */
export function buildOccurrenceMap(items, keyFn = fingerprintBaseKey) {
  const counts = new Map()
  const indices = new Map()
  for (const item of items) {
    const key = keyFn(item)
    const idx = counts.get(key) ?? 0
    indices.set(item, idx)
    counts.set(key, idx + 1)
  }
  return indices
}
