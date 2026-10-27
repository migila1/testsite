import { describe, expect, it } from 'vitest'
import { computeFingerprint, fingerprintBaseKey } from '../src/lib/fingerprint.js'
import { formatCents, parseEuroToCents } from '../src/lib/money.js'
import { applyInternalTransferDetection, normalizeIban } from '../src/lib/internalTransfer.js'
import { buildLearnedRuleUpsert, mergePatternWords } from '../src/lib/learnRule.js'
import { applyRules } from '../src/lib/rules.js'
import { filterForReports, sumByCategory } from '../src/lib/stats.js'

describe('money', () => {
  it('parseert NL bedrag naar centen', () => {
    expect(parseEuroToCents('12,34')).toBe(1234)
    expect(parseEuroToCents('-1.234,56')).toBe(-123456)
  })

  it('formatteert centen', () => {
    expect(formatCents(1234)).toContain('12')
  })
})

describe('fingerprint', () => {
  it('is stabiel per voorkomensindex', async () => {
    const tx = {
      accountId: 'a1',
      bookingDate: '2026-01-01',
      amountCents: -100,
      description: 'Test winkel',
      counterpartyIban: '',
    }
    const f0 = await computeFingerprint(tx, 0)
    const f1 = await computeFingerprint(tx, 1)
    expect(f0).not.toBe(f1)
    expect(fingerprintBaseKey(tx)).toContain('a1')
  })
})

describe('internalTransfer', () => {
  it('normaliseert iban', () => {
    expect(normalizeIban('nl12 ingb 123')).toBe('NL12INGB123')
  })

  it('markeert overboeking naar eigen iban', () => {
    const accounts = [
      { id: 'a1', iban: 'NL11INGB1111111111' },
      { id: 'a2', iban: 'NL22INGB2222222222' },
    ]
    const txs = [
      {
        id: '1',
        account_id: 'a1',
        counterparty_iban: 'NL22 INGB 2222 2222 22',
        amount_cents: -10000,
        booking_date: '2026-01-01',
        is_internal_transfer: false,
      },
    ]
    const out = applyInternalTransferDetection(txs, accounts)
    expect(out[0].is_internal_transfer).toBe(true)
  })
})

describe('learnRule', () => {
  it('voegt woorden samen in één regel', () => {
    expect(mergePatternWords('albert heijn', 'heijn rotterdam')).toBe('albert heijn rotterdam')
  })

  it('breidt bestaande leerregel uit i.p.v. nieuwe per woord', () => {
    const existing = [
      {
        id: 'r1',
        pattern: 'spotify',
        match_type: 'all_words',
        category_id: 'c1',
        active: true,
      },
    ]
    const result = buildLearnedRuleUpsert(existing, { pattern: 'spotify premium', category_id: 'c1' })
    expect(result.isNew).toBe(false)
    expect(result.rule.pattern).toBe('spotify premium')
  })
})

describe('rules', () => {
  it('matcht all_words als alle termen voorkomen', () => {
    const txs = [{ id: '1', description: 'SPOTIFY PREMIUM NL', category_id: null, category_source: null }]
    const rules = [
      { id: 'r1', pattern: 'spotify premium', match_type: 'all_words', category_id: 'c1', active: true, priority: 1 },
    ]
    const out = applyRules(txs, rules)
    expect(out[0].category_id).toBe('c1')
  })

  it('overschrijft handmatige categorie niet', () => {
    const txs = [
      { id: '1', description: 'spotify', category_id: 'cat-manual', category_source: 'manual' },
      { id: '2', description: 'spotify premium', category_id: null, category_source: null },
    ]
    const rules = [{ id: 'r1', pattern: 'spotify', match_type: 'contains', category_id: 'cat-rule', active: true, priority: 1 }]
    const out = applyRules(txs, rules)
    expect(out[0].category_id).toBe('cat-manual')
    expect(out[1].category_id).toBe('cat-rule')
  })
})

describe('stats', () => {
  it('sluit excluded en internal transfer uit', () => {
    const txs = [
      { amount_cents: -100, excluded: true, is_internal_transfer: false, category_id: 'c1' },
      { amount_cents: -200, excluded: false, is_internal_transfer: true, category_id: 'c1' },
      { amount_cents: -300, excluded: false, is_internal_transfer: false, category_id: 'c1' },
    ]
    expect(filterForReports(txs)).toHaveLength(1)
    expect(sumByCategory(txs)[0].totalCents).toBe(300)
  })

  it('filtert op geselecteerde maanden', () => {
    const txs = [
      { booking_date: '2026-01-15', amount_cents: -100, excluded: false, is_internal_transfer: false, category_id: 'c1' },
      { booking_date: '2026-02-10', amount_cents: -400, excluded: false, is_internal_transfer: false, category_id: 'c1' },
    ]
    expect(sumByCategory(txs, { months: ['2026-01'] })[0].totalCents).toBe(100)
  })
})
