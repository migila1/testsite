import { useEffect, useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar.jsx'
import { TxRow } from '../components/TransactionParts.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { useStore } from '../store.jsx'

export default function Transactions() {
  const { transactions, categories, categoryById, updateTransaction, saveCategory, loading } = useStore()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState('')
  const [selected, setSelected] = useState(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#0f766e')
  const [newCatBusy, setNewCatBusy] = useState(false)

  useEffect(() => {
    if (!selected) {
      setShowNewCategory(false)
      setNewCatName('')
      setNewCatColor('#0f766e')
    }
  }, [selected])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !`${t.description}`.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryId && t.category_id !== categoryId) return false
      if (month && !(t.booking_date ?? '').startsWith(month)) return false
      return true
    })
  }, [transactions, search, categoryId, month])

  const setCategory = async (catId) => {
    if (!selected) return
    await updateTransaction(selected.id, {
      category_id: catId || null,
      category_source: catId ? 'manual' : null,
    })
    setSelected(null)
  }

  const createCategoryAndAssign = async (e) => {
    e.preventDefault()
    if (!selected || !newCatName.trim()) return
    setNewCatBusy(true)
    try {
      const saved = await saveCategory({
        name: newCatName.trim(),
        color: newCatColor,
        sort_order: categories.length + 1,
      })
      await updateTransaction(selected.id, {
        category_id: saved.id,
        category_source: 'manual',
      })
      setSelected(null)
    } finally {
      setNewCatBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Filter">
        <FilterBar
          search={search}
          onSearch={setSearch}
          categoryId={categoryId}
          onCategory={setCategoryId}
          categories={categories}
          month={month}
          onMonth={setMonth}
        />
      </Card>
      <Card title={`Transacties (${filtered.length})`}>
        {loading && <p className="text-slate-500">Laden…</p>}
        <ul className="divide-y divide-slate-100">
          {filtered.map((tx) => (
            <li key={tx.id}>
              <TxRow
                tx={tx}
                categoryName={tx.category_id ? categoryById.get(tx.category_id)?.name : null}
                onSelect={setSelected}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Sheet open={!!selected} title="Categorie wijzigen" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{selected.description}</p>
            <label className="block text-sm">
              Categorie
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                value={selected.category_id ?? ''}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Geen</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {!showNewCategory ? (
              <Button type="button" variant="ghost" className="w-full justify-center" onClick={() => setShowNewCategory(true)}>
                + Nieuwe categorie
              </Button>
            ) : (
              <form onSubmit={createCategoryAndAssign} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">Nieuwe categorie</p>
                <label className="block text-sm">
                  Naam
                  <input
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="bijv. Abonnementen"
                    autoFocus
                  />
                </label>
                <label className="block text-sm">
                  Kleur
                  <input
                    type="color"
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white p-1"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={newCatBusy || !newCatName.trim()}>
                    {newCatBusy ? 'Bezig…' : 'Aanmaken en toewijzen'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowNewCategory(false)}>
                    Annuleren
                  </Button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => updateTransaction(selected.id, { excluded: !selected.excluded })}>
                {selected.excluded ? 'Meenemen in rapport' : 'Uitsluiten'}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  updateTransaction(selected.id, { is_internal_transfer: !selected.is_internal_transfer })
                }
              >
                {selected.is_internal_transfer ? 'Geen interne transfer' : 'Interne overboeking'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
