const euro = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
})

/** @param {number} cents */
export function formatCents(cents) {
  if (!Number.isFinite(cents)) return euro.format(0)
  return euro.format(cents / 100)
}

/** Parse "1.234,56" or "-12,34" naar centen (integer). */
export function parseEuroToCents(value) {
  if (value == null || value === '') return 0
  const s = String(value).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

/** @param {number} cents */
export function centsToInput(cents) {
  if (!Number.isFinite(cents)) return '0,00'
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const euros = Math.floor(abs / 100)
  const rest = String(abs % 100).padStart(2, '0')
  return `${sign}${euros},${rest}`
}
