import Papa from 'papaparse'
import { parseEuroToCents } from '../money.js'

const COL = {
  date: ['Datum', 'datum'],
  time: ['Tijd', 'tijd'],
  name: ['Naam / Omschrijving', 'Naam/Omschrijving', 'Naam / omschrijving'],
  account: ['Rekening', 'rekening'],
  counter: ['Tegenrekening', 'tegenrekening'],
  afBij: ['Af Bij', 'Af bij'],
  amount: ['Bedrag (EUR)', 'Bedrag (EUR)', 'Bedrag'],
  type: ['Mutatiesoort', 'mutatiesoort'],
  memo: ['Mededelingen', 'mededelingen'],
}

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k]
  }
  return ''
}

function parseIngDate(raw) {
  const s = String(raw ?? '').trim()
  const m = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  return s
}

function parseIngTime(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const hm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}${hm[3] ? `:${hm[3]}` : ''}`
  const compact = s.match(/^(\d{2})(\d{2})(\d{2})$/)
  if (compact) return `${compact[1]}:${compact[2]}:${compact[3]}`
  return s
}

function signedAmount(row) {
  const raw = pick(row, COL.amount)
  let cents = parseEuroToCents(raw)
  const afBij = pick(row, COL.afBij).toLowerCase()
  if (afBij === 'af' && cents > 0) cents = -cents
  if (afBij === 'bij' && cents < 0) cents = Math.abs(cents)
  return cents
}

/**
 * @param {string} csvText
 * @returns {{ rows: object[], errors: string[] }}
 */
export function parseIngCsv(csvText) {
  const parsed = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
  })
  const errors = (parsed.errors ?? []).map((e) => e.message)
  const rows = (parsed.data ?? []).map((row, index) => {
    const description = pick(row, COL.name)
    const counterpartyIban = pick(row, COL.counter)
    const bookingDate = parseIngDate(pick(row, COL.date))
    const amountCents = signedAmount(row)
    return {
      id: `row-${index}`,
      booking_date: bookingDate,
      description,
      counterparty_name: description.split(/\s{2,}/)[0]?.trim() ?? description,
      counterparty_iban: counterpartyIban,
      amount_cents: amountCents,
      mutation_type: pick(row, COL.type),
      memo: pick(row, COL.memo),
      booking_time: parseIngTime(pick(row, COL.time)),
      raw_account: pick(row, COL.account),
    }
  })
  return { rows, errors }
}
