import { useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar.jsx'
import { TxRow } from '../components/TransactionParts.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { useStore } from '../store.jsx'

export default function Transactions() {
  const { transactions, categories, categoryById, updateTransaction, loading } = useStore()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState('')
  const [selected, setSelected] = useState(null)

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
