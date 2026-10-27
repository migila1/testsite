import { useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { normalizePattern } from '../lib/learnRule.js'
import { useStore } from '../store.jsx'

function matchTypeLabel(matchType) {
  if (matchType === 'all_words') return 'alle woorden'
  if (matchType === 'regex') return 'regex'
  return 'volledige tekst'
}

export default function Rules() {
  const { rules, categories, saveRule, deleteRule, reapplyRules } = useStore()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [newPattern, setNewPattern] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editPattern, setEditPattern] = useState('')
  const [busy, setBusy] = useState(false)

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'nl')),
    [categories],
  )

  const rulesByCategory = useMemo(() => {
    const map = new Map()
    for (const r of rules) {
      if (!r.category_id) continue
      const list = map.get(r.category_id) ?? []
      list.push(r)
      map.set(r.category_id, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.pattern ?? '').localeCompare(b.pattern ?? '', 'nl'))
    }
    return map
  }, [rules])

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null
  const categoryRules = selectedCategoryId ? (rulesByCategory.get(selectedCategoryId) ?? []) : []

  const closeSheet = () => {
    setSelectedCategoryId(null)
    setNewPattern('')
    setEditingId(null)
    setEditPattern('')
  }

  const addPattern = async (e) => {
    e.preventDefault()
    const pattern = normalizePattern(newPattern)
    if (!pattern || !selectedCategoryId) return
    setBusy(true)
    try {
      await saveRule({
        pattern,
        match_type: 'contains',
        category_id: selectedCategoryId,
        priority: 50,
        active: true,
      })
      setNewPattern('')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (rule) => {
    setEditingId(rule.id)
    setEditPattern(rule.pattern ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPattern('')
  }

  const saveEdit = async (rule) => {
    const pattern = normalizePattern(editPattern)
    if (!pattern) return
    setBusy(true)
    try {
      await saveRule({ ...rule, pattern })
      cancelEdit()
    } finally {
      setBusy(false)
    }
  }

  const removePattern = async (id) => {
    setBusy(true)
    try {
      await deleteRule(id)
      if (editingId === id) cancelEdit()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Regels per categorie"
        action={
          <Button variant="secondary" onClick={reapplyRules}>
            Opnieuw toepassen
          </Button>
        }
      >
        <p className="mb-3 text-xs text-slate-600">
          Kies een categorie om zoekteksten toe te voegen of te wijzigen. Elke tekst wordt apart gezocht in
          omschrijving, mededelingen, tegenrekening (naam) of IBAN — de tekst moet als geheel in één veld staan (of alle
          woorden in hetzelfde veld bij geleerde regels). Handmatige categorieën op transacties blijven leidend.
        </p>
        {sortedCategories.length === 0 ? (
          <p className="text-sm text-slate-500">Maak eerst categorieën aan onder Categorieën.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sortedCategories.map((cat) => {
              const count = rulesByCategory.get(cat.id)?.length ?? 0
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl py-2 text-left hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: cat.color ?? '#94a3b8' }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 font-medium text-slate-900">{cat.name}</span>
                    <span className="shrink-0 text-sm text-slate-500">
                      {count === 0 ? 'Geen teksten' : `${count} ${count === 1 ? 'tekst' : 'teksten'}`}
                    </span>
                    <span className="shrink-0 text-slate-400" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Sheet open={!!selectedCategory} title={selectedCategory ? `Teksten — ${selectedCategory.name}` : ''} onClose={closeSheet}>
        {selectedCategory && (
          <div className="space-y-4">
            {categoryRules.length === 0 && (
              <p className="text-sm text-slate-500">Nog geen zoekteksten voor deze categorie.</p>
            )}
            <ul className="space-y-2">
              {categoryRules.map((rule) => (
                <li key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  {editingId === rule.id ? (
                    <div className="space-y-2">
                      <label className="block text-sm">
                        Tekst
                        <input
                          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                          value={editPattern}
                          onChange={(e) => setEditPattern(e.target.value)}
                          autoFocus
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" disabled={busy || !normalizePattern(editPattern)} onClick={() => saveEdit(rule)}>
                          Opslaan
                        </Button>
                        <Button type="button" variant="secondary" onClick={cancelEdit}>
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-11 items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium text-slate-900">“{rule.pattern}”</p>
                        <p className="text-xs text-slate-500">Match: {matchTypeLabel(rule.match_type)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                        <Button type="button" variant="secondary" className="min-h-11 px-3 text-xs" onClick={() => startEdit(rule)}>
                          Bewerken
                        </Button>
                        <Button type="button" variant="ghost" className="min-h-11 px-3 text-xs" onClick={() => removePattern(rule.id)}>
                          Verwijderen
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={addPattern} className="space-y-2 border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium text-slate-800">Nieuwe zoektekst</label>
              <input
                className="min-h-11 w-full rounded-xl border border-slate-200 px-3"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="bijv. albert heijn of netflix"
              />
              <Button type="submit" className="w-full" disabled={busy || !normalizePattern(newPattern)}>
                Tekst toevoegen
              </Button>
            </form>
          </div>
        )}
      </Sheet>
    </div>
  )
}
