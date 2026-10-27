import { useEffect, useMemo, useState } from 'react'
import CategoryNameInput from '../components/CategoryNameInput.jsx'
import FilterBar from '../components/FilterBar.jsx'
import TransactionDetail from '../components/TransactionDetail.jsx'
import { TxRow } from '../components/TransactionParts.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { findExactCategory } from '../lib/categorySuggest.js'
import { enrichTransaction } from '../lib/enrichTransaction.js'
import { suggestPatternFromTransaction } from '../lib/learnRule.js'
import { sortTransactions } from '../lib/sortTransactions.js'
import { transactionMatchText } from '../lib/transactionText.js'
import { useStore } from '../store.jsx'

export default function Transactions() {
  const {
    transactions,
    categories,
    categoryById,
    updateTransaction,
    assignManualCategory,
    assignManualCategoryBulk,
    saveCategory,
    loading,
  } = useStore()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [selected, setSelected] = useState(null)
  const [sheetStep, setSheetStep] = useState('detail')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#0f766e')
  const [newCatBusy, setNewCatBusy] = useState(false)
  const [learnPattern, setLearnPattern] = useState('')
  const [learnEnabled, setLearnEnabled] = useState(true)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkSheetOpen, setBulkSheetOpen] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    if (!selected) {
      setSheetStep('detail')
      setShowNewCategory(false)
      setNewCatName('')
      setNewCatColor('#0f766e')
      setLearnPattern('')
      setLearnEnabled(true)
    } else {
      setSheetStep('detail')
      setLearnPattern(suggestPatternFromTransaction(enrichTransaction(selected)))
      setLearnEnabled(true)
    }
  }, [selected])

  const filtered = useMemo(() => {
    const rows = transactions.filter((t) => {
      if (search && !transactionMatchText(t).includes(search.toLowerCase())) return false
      if (categoryId === '__geen__' && t.category_id) return false
      if (categoryId && categoryId !== '__geen__' && t.category_id !== categoryId) return false
      if (month && !(t.booking_date ?? '').startsWith(month)) return false
      return true
    })
    return sortTransactions(rows, sort)
  }, [transactions, search, categoryId, month, sort])

  const closeSheet = () => setSelected(null)

  const toggleSelected = (tx) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tx.id)) next.delete(tx.id)
      else next.add(tx.id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((t) => t.id)))
  }

  const clearBulkSelection = () => setSelectedIds(new Set())

  const exitSelectionMode = () => {
    setSelectionMode(false)
    clearBulkSelection()
    setBulkSheetOpen(false)
    setBulkCategoryId('')
  }

  const openBulkCategorySheet = () => {
    if (selectedIds.size === 0) return
    setBulkCategoryId('')
    setBulkSheetOpen(true)
  }

  const applyBulkCategory = async () => {
    if (selectedIds.size === 0) return
    setBulkBusy(true)
    try {
      await assignManualCategoryBulk([...selectedIds], bulkCategoryId || null)
      exitSelectionMode()
    } finally {
      setBulkBusy(false)
    }
  }

  const setCategory = async (catId) => {
    if (!selected) return
    if (!catId) {
      await updateTransaction(selected.id, { category_id: null, category_source: null })
      closeSheet()
      return
    }
    await assignManualCategory(selected.id, catId, { learnPattern, learnEnabled })
    closeSheet()
  }

  const useExistingCategory = async (cat) => {
    if (!selected) return
    setNewCatBusy(true)
    try {
      await assignManualCategory(selected.id, cat.id, { learnPattern, learnEnabled })
      closeSheet()
    } finally {
      setNewCatBusy(false)
    }
  }

  const createCategoryAndAssign = async (e) => {
    e.preventDefault()
    if (!selected || !newCatName.trim()) return
    setNewCatBusy(true)
    try {
      const existing = findExactCategory(newCatName, categories)
      if (existing) {
        await assignManualCategory(selected.id, existing.id, { learnPattern, learnEnabled })
        closeSheet()
        return
      }
      const saved = await saveCategory({
        name: newCatName.trim(),
        color: newCatColor,
        sort_order: categories.length + 1,
      })
      await assignManualCategory(selected.id, saved.id, { learnPattern, learnEnabled })
      closeSheet()
    } finally {
      setNewCatBusy(false)
    }
  }

  const selectedCategoryName = selected?.category_id ? categoryById.get(selected.category_id)?.name : null

  const bulkBarVisible = selectionMode && selectedIds.size > 0

  return (
    <div className={`space-y-4 ${bulkBarVisible ? 'pb-24 lg:pb-0' : ''}`}>
      <Card title="Filter">
        <FilterBar
          search={search}
          onSearch={setSearch}
          categoryId={categoryId}
          onCategory={setCategoryId}
          categories={categories}
          month={month}
          onMonth={setMonth}
          sort={sort}
          onSort={setSort}
        />
      </Card>
      <Card
        title={`Transacties (${filtered.length})`}
        action={
          <div className="flex flex-wrap justify-end gap-1">
            {selectionMode ? (
              <>
                <Button variant="ghost" className="min-h-11 px-2 text-xs" onClick={selectAllFiltered}>
                  Alles
                </Button>
                <Button variant="ghost" className="min-h-11 px-2 text-xs" onClick={clearBulkSelection}>
                  Geen
                </Button>
                <Button variant="secondary" className="min-h-11 px-3 text-xs" onClick={exitSelectionMode}>
                  Klaar
                </Button>
              </>
            ) : (
              <Button variant="secondary" className="min-h-11 px-3 text-xs" onClick={() => setSelectionMode(true)}>
                Selecteren
              </Button>
            )}
          </div>
        }
      >
        {loading && <p className="text-slate-500">Laden…</p>}
        {selectionMode && (
          <p className="mb-2 text-xs text-slate-600">Tik op transacties om ze te selecteren.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {filtered.map((tx) => (
            <li key={tx.id}>
              <TxRow
                tx={tx}
                categoryName={tx.category_id ? categoryById.get(tx.category_id)?.name : null}
                categoryColor={tx.category_id ? categoryById.get(tx.category_id)?.color : null}
                onSelect={setSelected}
                selectionMode={selectionMode}
                selected={selectedIds.has(tx.id)}
                onToggleSelect={toggleSelected}
              />
            </li>
          ))}
        </ul>
      </Card>

      {selectionMode && selectedIds.size > 0 && (
        <div
          className="fixed inset-x-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:static lg:mt-0 lg:rounded-2xl lg:border lg:shadow-sm"
          style={{ bottom: 'calc(3.75rem + var(--safe-bottom))' }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-2 lg:max-w-none">
            <p className="min-w-0 flex-1 text-sm text-slate-700">
              <span className="font-semibold tabular-nums">{selectedIds.size}</span> geselecteerd
            </p>
            <Button variant="ghost" className="shrink-0" onClick={clearBulkSelection}>
              Wissen
            </Button>
            <Button className="shrink-0" onClick={openBulkCategorySheet}>
              Categorie…
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={bulkSheetOpen}
        title={`Categorie — ${selectedIds.size} transactie${selectedIds.size === 1 ? '' : 's'}`}
        onClose={() => {
          setBulkSheetOpen(false)
          setBulkCategoryId('')
        }}
      >
        <div className="space-y-4">
          <label className="block text-sm">
            Categorie
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
            >
              <option value="">Geen categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-600">
            Regels leren kan alleen via één transactie openen en daar categorie toewijzen.
          </p>
          <Button className="w-full" disabled={bulkBusy} onClick={applyBulkCategory}>
            {bulkBusy ? 'Bezig…' : 'Toewijzen'}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={!!selected}
        title={sheetStep === 'detail' ? 'Transactie' : 'Categorie toewijzen'}
        onClose={closeSheet}
      >
        {selected && sheetStep === 'detail' && (
          <div className="space-y-4">
            <TransactionDetail tx={selected} categoryName={selectedCategoryName} />
            <Button className="w-full" onClick={() => setSheetStep('category')}>
              Categorie toewijzen
            </Button>
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

        {selected && sheetStep === 'category' && (
          <div className="space-y-3">
            <Button variant="ghost" onClick={() => setSheetStep('detail')}>
              ← Terug naar details
            </Button>
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

            <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-sm">
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={learnEnabled}
                  onChange={(e) => setLearnEnabled(e.target.checked)}
                />
                <span>Onthoud als regel voor vergelijkbare transacties</span>
              </label>
              {learnEnabled && (
                <label className="block">
                  Woorden in één regel (spatie tussen woorden)
                  <input
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
                    value={learnPattern}
                    onChange={(e) => setLearnPattern(e.target.value)}
                    placeholder="bijv. albert heijn"
                  />
                </label>
              )}
              <p className="text-xs text-slate-600">
                Kopieer tekst uit mededelingen in het detail scherm. Regels zoeken in omschrijving, tegenrekening en
                mededelingen.
              </p>
            </div>

            {!showNewCategory ? (
              <Button type="button" variant="ghost" className="w-full justify-center" onClick={() => setShowNewCategory(true)}>
                + Nieuwe categorie
              </Button>
            ) : (
              <form onSubmit={createCategoryAndAssign} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">Nieuwe categorie</p>
                <label className="block text-sm">
                  Naam
                  <CategoryNameInput
                    value={newCatName}
                    onChange={setNewCatName}
                    categories={categories}
                    onUseExisting={useExistingCategory}
                    placeholder="bijv. vakantie"
                    inputClassName="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3"
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
          </div>
        )}
      </Sheet>
    </div>
  )
}
