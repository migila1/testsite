import { normalizePattern, patternWords } from './learnRule.js'
import { transactionRuleFields } from './transactionText.js'

function normalizeFieldText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function fieldContainsPhrase(field, pattern) {
  const hay = normalizeFieldText(field)
  const needle = normalizePattern(pattern)
  if (!needle) return false
  return hay.includes(needle)
}

function fieldContainsAllWords(field, pattern) {
  const hay = normalizeFieldText(field)
  const words = patternWords(pattern)
  if (words.length === 0) return false
  return words.every((w) => hay.includes(w))
}

function safeRegex(pattern) {
  try {
    return new RegExp(pattern, 'i')
  } catch {
    return /(?!)/ 
  }
}

/** @returns {boolean} */
export function ruleMatchesTransaction(rule, tx) {
  if (!rule?.active) return false
  const pattern = rule.pattern ?? ''
  if (!String(pattern).trim()) return false

  const fields = transactionRuleFields(tx)

  if (rule.match_type === 'regex') {
    const re = safeRegex(pattern)
    return fields.some((field) => re.test(field))
  }

  if (rule.match_type === 'all_words') {
    return fields.some((field) => fieldContainsAllWords(field, pattern))
  }

  return fields.some((field) => fieldContainsPhrase(field, pattern))
}

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
    for (const rule of sorted) {
      if (ruleMatchesTransaction(rule, tx)) {
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
