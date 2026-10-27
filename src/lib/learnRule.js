const STOPWORDS = new Set([
  'de',
  'het',
  'een',
  'van',
  'voor',
  'bij',
  'via',
  'and',
  'the',
])

export function normalizePattern(pattern) {
  return String(pattern ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function patternWords(pattern) {
  return [...new Set(normalizePattern(pattern).split(' ').filter((w) => w.length > 0))]
}

/** Voeg woorden samen in één regel (geen dubbele woorden). */
export function mergePatternWords(a, b) {
  const merged = new Set([...patternWords(a), ...patternWords(b)])
  return [...merged].join(' ')
}

function tokenizeField(text) {
  const hay = String(text ?? '').toLowerCase()
  const tokens = hay
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOPWORDS.has(w))
  const unique = []
  for (const t of tokens) {
    if (unique[unique.length - 1] !== t) unique.push(t)
  }
  return unique
}

/** Mededelingen eerst — tegenrekening/omschrijving zijn vaak hetzelfde voor verschillende doelen. */
export function suggestPatternFromTransaction(tx) {
  const memoTokens = tokenizeField(tx.memo)
  const otherTokens = tokenizeField(`${tx.description ?? ''} ${tx.counterparty_name ?? ''}`)
  const combined = []
  for (const t of [...memoTokens, ...otherTokens]) {
    if (!combined.includes(t)) combined.push(t)
  }
  return combined.slice(0, 3).join(' ')
}

function rulesShareWords(a, b) {
  const wa = patternWords(a)
  const wb = patternWords(b)
  return wa.some((w) => wb.includes(w))
}

/** Zoek bestaande leerregel om uit te breiden i.p.v. een nieuwe per woord. */
export function findLearnRuleToMerge(existingRules, categoryId, pattern) {
  const normalized = normalizePattern(pattern)
  if (!normalized) return null

  const learned = existingRules.filter(
    (r) => r.category_id === categoryId && r.active !== false && r.match_type === 'all_words',
  )
  const overlapping = learned.find((r) => rulesShareWords(r.pattern, normalized))
  if (overlapping) return overlapping

  const exact = learned.find((r) => normalizePattern(r.pattern) === normalized)
  return exact ?? null
}

/**
 * @returns {{ rule: object, isNew: boolean } | null}
 */
export function buildLearnedRuleUpsert(existingRules, { pattern, category_id }) {
  const words = patternWords(pattern)
  if (words.length === 0 || !category_id) return null

  const finalPattern = words.join(' ')
  const duplicate = existingRules.find(
    (r) =>
      r.category_id === category_id &&
      r.active !== false &&
      normalizePattern(r.pattern) === finalPattern &&
      r.match_type === 'all_words',
  )
  if (duplicate) return null

  const mergeTarget = findLearnRuleToMerge(existingRules, category_id, finalPattern)
  if (mergeTarget) {
    const merged = mergePatternWords(mergeTarget.pattern, finalPattern)
    if (normalizePattern(merged) === normalizePattern(mergeTarget.pattern)) return null
    return {
      rule: {
        ...mergeTarget,
        pattern: merged,
        match_type: 'all_words',
        priority: mergeTarget.priority ?? 35,
        active: true,
      },
      isNew: false,
    }
  }

  return {
    rule: {
      pattern: finalPattern,
      match_type: 'all_words',
      category_id,
      priority: 35,
      active: true,
    },
    isNew: true,
  }
}
