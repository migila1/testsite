function cmpDate(a, b) {
  return (a.booking_date ?? '').localeCompare(b.booking_date ?? '')
}

function cmpId(a, b) {
  return String(a.id ?? '').localeCompare(String(b.id ?? ''))
}

/** @param {'date-desc'|'date-asc'|'amount-desc'|'amount-asc'} mode */
export function sortTransactions(list, mode = 'date-desc') {
  const copy = [...list]
  copy.sort((a, b) => {
    switch (mode) {
      case 'date-asc':
        return cmpDate(a, b) || cmpId(a, b)
      case 'amount-desc':
        return (b.amount_cents ?? 0) - (a.amount_cents ?? 0) || cmpDate(b, a) || cmpId(a, b)
      case 'amount-asc':
        return (a.amount_cents ?? 0) - (b.amount_cents ?? 0) || cmpDate(b, a) || cmpId(a, b)
      case 'date-desc':
      default:
        return cmpDate(b, a) || cmpId(a, b)
    }
  })
  return copy
}

export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Datum (nieuw → oud)' },
  { value: 'date-asc', label: 'Datum (oud → nieuw)' },
  { value: 'amount-desc', label: 'Bedrag (hoog → laag)' },
  { value: 'amount-asc', label: 'Bedrag (laag → hoog)' },
]
