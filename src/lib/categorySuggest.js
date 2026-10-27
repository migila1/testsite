export function normalizeCategoryName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function findExactCategory(name, categories) {
  const q = normalizeCategoryName(name)
  if (!q) return null
  return categories.find((c) => normalizeCategoryName(c.name) === q) ?? null
}

/** @returns {Array<{ category: object, kind: 'prefix'|'contains' }>} */
export function findCategorySuggestions(query, categories, limit = 6) {
  const q = normalizeCategoryName(query)
  if (q.length < 2) return []

  const hits = []
  for (const category of categories) {
    const n = normalizeCategoryName(category.name)
    if (n.startsWith(q)) hits.push({ category, kind: 'prefix', score: n.length })
    else if (n.includes(q)) hits.push({ category, kind: 'contains', score: 100 + n.length })
  }

  hits.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'prefix' ? -1 : 1
    return a.score - b.score
  })

  const seen = new Set()
  const out = []
  for (const h of hits) {
    if (seen.has(h.category.id)) continue
    seen.add(h.category.id)
    out.push(h)
    if (out.length >= limit) break
  }
  return out
}

/** Eén duidelijke prefix-match (bijv. vaka → vakantie). */
export function findSinglePrefixCategory(query, categories) {
  const q = normalizeCategoryName(query)
  if (q.length < 2) return null
  const matches = categories.filter((c) => normalizeCategoryName(c.name).startsWith(q))
  if (matches.length !== 1) return null
  return matches[0]
}
