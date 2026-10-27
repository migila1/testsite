/**
 * Past regels toe op transacties. Handmatige categorieën blijven intact.
 * @param {Array} transactions
 * @param {Array} rules gesorteerd op priority (lager = eerder)
 */
export function applyRules(transactions, rules) {
  const sorted = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  return transactions.map((tx) => {
    if (tx.category_source === 'manual' && tx.category_id) {
      return tx
    }
    const hay = `${tx.description ?? ''} ${tx.counterparty_name ?? ''}`.toLowerCase()
    for (const rule of sorted) {
      if (!rule.active) continue
      const needle = (rule.pattern ?? '').toLowerCase()
      if (!needle) continue
      let match = false
      if (rule.match_type === 'regex') {
        match = safeRegex(rule.pattern).test(hay)
      } else if (rule.match_type === 'all_words') {
        const words = needle.split(/\s+/).filter(Boolean)
        match = words.length > 0 && words.every((w) => hay.includes(w))
      } else {
        match = hay.includes(needle)
      }
      if (match) {
        return {
          ...tx,
          category_id: rule.category_id,
          category_source: 'rule',
          rule_id: rule.id,
        }
      }
    }
    return tx
  })
}

function safeRegex(pattern) {
  try {
    return new RegExp(pattern, 'i')
  } catch {
    return /(?!)/ 
  }
}
