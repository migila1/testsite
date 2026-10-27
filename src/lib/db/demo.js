const KEY = 'mijn-uitgaven-demo-v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function uid() {
  return crypto.randomUUID()
}

const defaultCategories = () => [
  { id: uid(), name: 'Boodschappen', color: '#059669', sort_order: 1 },
  { id: uid(), name: 'Vervoer', color: '#2563eb', sort_order: 2 },
  { id: uid(), name: 'Horeca', color: '#d97706', sort_order: 3 },
  { id: uid(), name: 'Overig', color: '#64748b', sort_order: 99 },
]

function seedState() {
  const accountId = uid()
  const cats = defaultCategories()
  const today = new Date()
  const d = (offset) => {
    const x = new Date(today)
    x.setDate(x.getDate() - offset)
    return x.toISOString().slice(0, 10)
  }
  return {
    accounts: [{ id: accountId, name: 'ING Betaalrekening', iban: 'NL00INGB0000000000', currency: 'EUR' }],
    categories: cats,
    rules: [
      {
        id: uid(),
        pattern: 'albert heijn',
        match_type: 'contains',
        category_id: cats[0].id,
        priority: 10,
        active: true,
      },
    ],
    transactions: [
      {
        id: uid(),
        account_id: accountId,
        booking_date: d(3),
        description: 'ALBERT HEIJN 1234 AMSTERDAM',
        counterparty_name: 'Albert Heijn',
        counterparty_iban: '',
        amount_cents: -4567,
        category_id: cats[0].id,
        category_source: 'rule',
        excluded: false,
        is_internal_transfer: false,
        fingerprint: 'seed-1',
      },
      {
        id: uid(),
        account_id: accountId,
        booking_date: d(10),
        description: 'Salaris werkgever',
        counterparty_name: 'Werkgever BV',
        counterparty_iban: '',
        amount_cents: 325000,
        category_id: null,
        category_source: null,
        excluded: false,
        is_internal_transfer: false,
        fingerprint: 'seed-2',
      },
    ],
  }
}

function ensureState(seed) {
  let state = load()
  if (!state) {
    state = seed && import.meta.env.VITE_DEMO_SEED === 'true' ? seedState() : {
      accounts: [],
      categories: defaultCategories(),
      rules: [],
      transactions: [],
    }
    save(state)
  }
  return state
}

export function createDemoDb() {
  let state = ensureState(true)

  const persist = () => save(state)

  return {
    mode: 'demo',
    async init() {
      state = ensureState(true)
    },
    async listAccounts() {
      return [...state.accounts]
    },
    async saveAccount(account) {
      const idx = state.accounts.findIndex((a) => a.id === account.id)
      if (idx >= 0) state.accounts[idx] = account
      else state.accounts.push({ ...account, id: account.id ?? uid() })
      persist()
      return account
    },
    async deleteAccount(id) {
      state.accounts = state.accounts.filter((a) => a.id !== id)
      persist()
    },
    async listCategories() {
      return [...state.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    },
    async saveCategory(cat) {
      const idx = state.categories.findIndex((c) => c.id === cat.id)
      let saved
      if (idx >= 0) {
        state.categories[idx] = cat
        saved = state.categories[idx]
      } else {
        saved = { ...cat, id: cat.id ?? uid() }
        state.categories.push(saved)
      }
      persist()
      return saved
    },
    async deleteCategory(id) {
      state.categories = state.categories.filter((c) => c.id !== id)
      state.transactions = state.transactions.map((t) =>
        t.category_id === id ? { ...t, category_id: null, category_source: null } : t,
      )
      persist()
    },
    async listRules() {
      return [...state.rules]
    },
    async saveRule(rule) {
      const idx = state.rules.findIndex((r) => r.id === rule.id)
      let saved
      if (idx >= 0) {
        state.rules[idx] = rule
        saved = state.rules[idx]
      } else {
        saved = { ...rule, id: rule.id ?? uid() }
        state.rules.push(saved)
      }
      persist()
      return saved
    },
    async deleteRule(id) {
      state.rules = state.rules.filter((r) => r.id !== id)
      persist()
    },
    async listTransactions() {
      return [...state.transactions].sort((a, b) => (b.booking_date ?? '').localeCompare(a.booking_date ?? ''))
    },
    async upsertTransactions(rows) {
      const byFp = new Map(state.transactions.map((t) => [`${t.account_id}:${t.fingerprint}`, t]))
      let inserted = 0
      let skipped = 0
      for (const row of rows) {
        const key = `${row.account_id}:${row.fingerprint}`
        if (byFp.has(key)) {
          skipped += 1
          continue
        }
        const tx = { ...row, id: row.id ?? uid() }
        state.transactions.push(tx)
        byFp.set(key, tx)
        inserted += 1
      }
      persist()
      return { inserted, skipped }
    },
    async updateTransaction(id, patch) {
      const idx = state.transactions.findIndex((t) => t.id === id)
      if (idx < 0) return null
      state.transactions[idx] = { ...state.transactions[idx], ...patch }
      persist()
      return state.transactions[idx]
    },
    async replaceAllTransactions(transactions) {
      state.transactions = transactions
      persist()
    },
  }
}
