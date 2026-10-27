function isBlank(value) {
  return !String(value ?? '').trim()
}

function textBlob(tx) {
  return [tx.memo, tx.description, tx.counterparty_name, tx.counterparty_iban].filter((t) => !isBlank(t)).join('\n')
}

function formatClock(h, m, s) {
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  if (s != null && s !== '') return `${hh}:${mm}:${String(s).padStart(2, '0')}`
  return `${hh}:${mm}`
}

export function extractTimeFromText(text) {
  const s = String(text ?? '')
  if (!s.trim()) return ''

  const iso = s.match(/\b(20\d{2}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/i)
  if (iso) return formatClock(iso[2], iso[3], iso[4])

  const dmy = s.match(/\b(\d{2}-\d{2}-20\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (dmy) return formatClock(dmy[2], dmy[3], dmy[4])

  const tIso = s.match(/\bT(\d{2}):(\d{2}):(\d{2})\b/)
  if (tIso) return `${tIso[1]}:${tIso[2]}:${tIso[3]}`

  const keyword = s.match(/\b(?:tijd|om|verwerkt)\s*[:\s]*(\d{1,2}):(\d{2})(?::(\d{2}))?/i)
  if (keyword) return formatClock(keyword[1], keyword[2], keyword[3])

  for (const m of s.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/g)) {
    const idx = m.index ?? 0
    const before = s.slice(Math.max(0, idx - 6), idx)
    if (/\d{4}-$/.test(before) || /\d{2}-$/.test(before)) continue
    return formatClock(m[1], m[2], m[3])
  }
  return ''
}

export function extractIbanFromText(text) {
  const compact = String(text ?? '').replace(/\s/g, '').toUpperCase()
  const m = compact.match(/NL[0-9]{2}[A-Z]{4}[0-9]{10}/)
  return m ? m[0] : ''
}

export function inferMutationType(description, memo) {
  const hay = `${description ?? ''} ${memo ?? ''}`.toLowerCase()
  const rules = [
    ['sepa incasso', 'SEPA incasso'],
    ['sepa overboeking', 'SEPA overboeking'],
    ['sepa ideal', 'iDEAL'],
    [' ideal', 'iDEAL'],
    ['betaalautomaat', 'Betaalautomaat'],
    [' bea', 'Betaalautomaat'],
    ['geldautomaat', 'Geldautomaat'],
    [' incasso', 'Incasso'],
    ['salarisbetaling', 'Salaris'],
    ['salaris', 'Salaris'],
  ]
  for (const [needle, label] of rules) {
    if (hay.includes(needle)) return label
  }
  return ''
}

export function extractCounterpartyName(tx) {
  const memo = String(tx.memo ?? '').trim()
  const desc = String(tx.description ?? '').trim()

  if (memo) {
    const labeled = memo.match(/(?:^|\n)\s*(?:naam|ontvanger|begunstigde)[:\s]+(.+)/i)
    if (labeled) return labeled[1].trim().split('\n')[0].slice(0, 160)

    for (const line of memo.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const compact = line.replace(/\s/g, '')
      if (/^NL[0-9]{2}[A-Z]{4}/i.test(compact)) continue
      if (/^(kenmerk|referentie|mededeling|iban|bic|omschrijving)/i.test(line)) continue
      if (/^\d+$/.test(line)) continue
      if (line.length >= 2) return line.slice(0, 160)
    }
  }

  if (desc) {
    const head = desc.split(/\s{2,}/)[0]?.trim() ?? desc.split('\n')[0]?.trim()
    if (head && head.length >= 2) return head.slice(0, 160)
  }
  return ''
}

export function extractDateFromText(text) {
  const s = String(text ?? '')
  const iso = s.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]
  const dmy = s.match(/\b(\d{2})-(\d{2})-(20\d{2})\b/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  const ymd = s.match(/\b(20\d{2})(\d{2})(\d{2})\b/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`
  return ''
}

/** Vult lege velden aan uit omschrijving, mededelingen, enz. */
export function enrichTransaction(tx) {
  const blob = textBlob(tx)
  const memo = String(tx.memo ?? '').trim()
  const desc = String(tx.description ?? '').trim()

  let booking_time = String(tx.booking_time ?? '').trim()
  if (!booking_time) {
    booking_time =
      extractTimeFromText(memo) || extractTimeFromText(desc) || extractTimeFromText(blob)
  }

  let counterparty_iban = String(tx.counterparty_iban ?? '').trim()
  if (!counterparty_iban) {
    counterparty_iban = extractIbanFromText(memo) || extractIbanFromText(desc) || extractIbanFromText(blob)
  }

  let counterparty_name = String(tx.counterparty_name ?? '').trim()
  if (!counterparty_name || counterparty_name === desc) {
    const extracted = extractCounterpartyName({ ...tx, counterparty_iban, memo, description: desc })
    if (extracted) counterparty_name = extracted
  }

  let mutation_type = String(tx.mutation_type ?? '').trim()
  if (!mutation_type) {
    mutation_type = inferMutationType(desc, memo)
  }

  let booking_date = String(tx.booking_date ?? '').trim()
  if (!booking_date) {
    booking_date = extractDateFromText(blob)
  }

  let enrichedMemo = memo
  if (!enrichedMemo && desc.includes('\n')) {
    enrichedMemo = desc.split('\n').slice(1).join('\n').trim()
  }

  let description = desc
  if (description.includes('\n') && enrichedMemo) {
    description = description.split('\n')[0].trim()
  }

  return {
    ...tx,
    booking_date: booking_date || tx.booking_date,
    booking_time: booking_time || null,
    counterparty_iban,
    counterparty_name,
    mutation_type,
    memo: enrichedMemo,
    description,
  }
}

const PERSIST_KEYS = ['booking_time', 'counterparty_iban', 'counterparty_name', 'mutation_type', 'memo', 'booking_date']

/** Alleen lege velden in de database bijwerken. */
export function enrichmentPatch(original, enriched) {
  const patch = {}
  for (const key of PERSIST_KEYS) {
    if (isBlank(original[key]) && !isBlank(enriched[key])) {
      patch[key] = enriched[key]
    }
  }
  return patch
}
