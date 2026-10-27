import { useMemo, useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { formatCents, parseEuroToCents } from '../lib/money.js'
import {
  listYears,
  monthlyTotals,
  monthsForYear,
  periodIncomeExpense,
  sumByCategoryForMode,
} from '../lib/stats.js'

const CHART_MODES = [
  { id: 'expense', label: 'Uitgaven per categorie', empty: 'Geen uitgaven in deze periode.' },
  { id: 'income', label: 'Inkomsten per categorie', empty: 'Geen inkomsten in deze periode.' },
  { id: 'balance', label: 'Saldo per categorie', empty: 'Geen saldo per categorie in deze periode.' },
]
import { useStore } from '../store.jsx'

function monthLabel(ym) {
  const [y, m] = ym.split('-')
  const names = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${names[Number(m) - 1] ?? m} ${y}`
}

function periodTitle(transactions, selectedMonths, yearFocus) {
  if (!selectedMonths.length) return 'Alle periodes'
  if (yearFocus && selectedMonths.every((m) => m.startsWith(`${yearFocus}-`))) {
    const all = monthsForYear(transactions, yearFocus)
    if (all.length > 0 && selectedMonths.length === all.length) return `Jaar ${yearFocus}`
  }
  if (selectedMonths.length === 1) return monthLabel(selectedMonths[0])
  return `${selectedMonths.length} maanden`
}

export default function Dashboard() {
  const { transactions, adjustments, categories, categoryById, loading, saveAdjustment, deleteAdjustment } =
    useStore()
  const years = useMemo(() => listYears(transactions), [transactions])
  const months = useMemo(() => monthlyTotals(transactions), [transactions])
  const [yearFocus, setYearFocus] = useState(() => years[0] ?? new Date().getFullYear().toString())
  const [selectedMonths, setSelectedMonths] = useState([])
  const [chartMode, setChartMode] = useState('expense')

  const monthKeys = selectedMonths.length ? selectedMonths : null
  const modeMeta = CHART_MODES.find((m) => m.id === chartMode) ?? CHART_MODES[0]

  const byCat = useMemo(() => {
    return sumByCategoryForMode(transactions, {
      mode: chartMode,
      months: monthKeys,
      adjustments,
    }).map(({ categoryId, totalCents }) => ({
      categoryId,
      name: categoryId === '__geen__' ? 'Geen categorie' : categoryById.get(categoryId)?.name ?? 'Onbekend',
      totalCents,
      color: categoryId === '__geen__' ? '#94a3b8' : categoryById.get(categoryId)?.color ?? '#0f766e',
    }))
  }, [transactions, adjustments, monthKeys, categoryById, chartMode])

  const { income, expense } = useMemo(
    () => periodIncomeExpense(transactions, { months: monthKeys, adjustments }),
    [transactions, adjustments, monthKeys],
  )

  const visibleAdjustments = useMemo(() => {
    if (!monthKeys?.length) return adjustments
    const set = new Set(monthKeys)
    return adjustments.filter((a) => set.has(a.month))
  }, [adjustments, monthKeys])

  const [adjMonth, setAdjMonth] = useState('')
  const [adjCategory, setAdjCategory] = useState('')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjLabel, setAdjLabel] = useState('')

  const toggleMonth = (month) => {
    setSelectedMonths((prev) => {
      const set = new Set(prev)
      if (set.has(month)) set.delete(month)
      else set.add(month)
      return [...set].sort()
    })
  }

  const selectYear = (year) => {
    setYearFocus(year)
    setSelectedMonths(monthsForYear(transactions, year))
  }

  const clearSelection = () => setSelectedMonths([])

  const addAdjustment = async (e) => {
    e.preventDefault()
    const cents = parseEuroToCents(adjAmount)
    if (!adjMonth || !adjCategory || cents <= 0) return
    await saveAdjustment({
      month: adjMonth,
      category_id: adjCategory,
      amount_cents: cents,
      label: adjLabel.trim() || 'Eenmalige toevoeging',
    })
    setAdjAmount('')
    setAdjLabel('')
  }

  const chartHeight = Math.max(200, byCat.length * 36)

  const formatChartCents = (cents) => formatCents(chartMode === 'expense' ? -Math.abs(cents) : cents)

  if (loading) return <p className="text-slate-600">Laden…</p>

  const monthOptions =
    monthKeys?.length ? monthKeys : months.map((m) => m.month).filter(Boolean)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title={`Overzicht — ${periodTitle(transactions, selectedMonths, yearFocus)}`}
        className="hidden lg:block"
      >
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Inkomsten</dt>
            <dd className="text-lg font-semibold text-emerald-700">{formatCents(income)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Uitgaven</dt>
            <dd className="text-lg font-semibold text-red-700">{formatCents(-expense)}</dd>
          </div>
        </dl>
        {selectedMonths.length > 0 && (
          <Button variant="ghost" className="mt-2" onClick={clearSelection}>
            Toon alle periodes
          </Button>
        )}
      </Card>

      <Card
        title={`${modeMeta.label} — ${periodTitle(transactions, selectedMonths, yearFocus)}`}
        action={
          <div className="flex flex-wrap gap-1">
            {CHART_MODES.map((m) => (
              <Button
                key={m.id}
                variant={chartMode === m.id ? 'primary' : 'secondary'}
                className="min-h-11 px-3 text-xs"
                onClick={() => setChartMode(m.id)}
              >
                {m.id === 'expense' ? 'Uitgaven' : m.id === 'income' ? 'Inkomsten' : 'Saldo'}
              </Button>
            ))}
          </div>
        }
      >
        <dl className="mb-3 grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 text-sm lg:hidden">
          <div>
            <dt className="text-slate-500">Inkomsten</dt>
            <dd className="font-semibold text-emerald-700">{formatCents(income)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Uitgaven</dt>
            <dd className="font-semibold text-red-700">{formatCents(-expense)}</dd>
          </div>
        </dl>
        {selectedMonths.length > 0 && (
          <Button variant="ghost" className="mb-2 lg:hidden" onClick={clearSelection}>
            Toon alle periodes
          </Button>
        )}
        {byCat.length === 0 ? (
          <p className="text-sm text-slate-500">{modeMeta.empty}</p>
        ) : (
          <div className="w-full min-w-0" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byCat}
                layout="vertical"
                margin={{ left: chartMode === 'balance' ? 8 : 4, right: 88, top: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  hide={chartMode !== 'balance'}
                  domain={chartMode === 'balance' ? ['auto', 'auto'] : [0, 'dataMax']}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => formatCents(v)}
                />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatChartCents(v)} />
                <Bar dataKey="totalCents" radius={4}>
                  {byCat.map((entry) => (
                    <Cell
                      key={entry.categoryId}
                      fill={
                        chartMode === 'balance' && entry.totalCents < 0
                          ? '#dc2626'
                          : chartMode === 'balance' && entry.totalCents > 0
                            ? '#059669'
                            : entry.color
                      }
                    />
                  ))}
                  <LabelList dataKey="totalCents" position="right" formatter={(v) => formatChartCents(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Jaar & maanden" className="lg:col-span-2">
        <div className="mb-3 flex flex-wrap gap-2">
          {years.map((y) => (
            <Button key={y} variant={yearFocus === y && selectedMonths.length ? 'primary' : 'secondary'} onClick={() => selectYear(y)}>
              Jaar {y}
            </Button>
          ))}
          <Button variant="ghost" onClick={clearSelection}>
            Alles
          </Button>
        </div>
        <p className="mb-2 text-xs text-slate-600">
          Klik op maanden om te selecteren (meerdere mogelijk). Jaar-knop selecteert alle maanden met data in dat jaar.
        </p>
        <ul className="divide-y divide-slate-100 text-sm">
          {months.length === 0 && <li className="py-2 text-slate-500">Nog geen data.</li>}
          {months.map((m) => {
            const active = selectedMonths.includes(m.month)
            return (
              <li key={m.month}>
                <button
                  type="button"
                  onClick={() => toggleMonth(m.month)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2 py-2 text-left ${
                    active ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        active ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                      }`}
                      aria-hidden
                    >
                      {active ? '✓' : ''}
                    </span>
                    {monthLabel(m.month)}
                  </span>
                  <span className="text-slate-600 tabular-nums">
                    {formatCents(m.income)} / {formatCents(-m.expense)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Eenmalig bedrag aan categorie" className="lg:col-span-2">
        <p className="mb-3 text-sm text-slate-600">
          Tel een bedrag extra bij een categorie voor één maand (bijv. contant uitgegeven, niet in import). Meegenomen in
          grafiek en totalen van die maand/periode.
        </p>
        <form onSubmit={addAdjustment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="text-sm">
            Maand
            <input
              type="month"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={adjMonth || monthOptions[0] || ''}
              onChange={(e) => setAdjMonth(e.target.value)}
              required
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Categorie
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={adjCategory || categories[0]?.id || ''}
              onChange={(e) => setAdjCategory(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Bedrag
            <input
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              placeholder="12,50"
              required
            />
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-1">
            Omschrijving
            <input
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={adjLabel}
              onChange={(e) => setAdjLabel(e.target.value)}
              placeholder="Optioneel"
            />
          </label>
          <Button type="submit" className="sm:col-span-2 lg:col-span-5 lg:w-auto">
            Toevoegen
          </Button>
        </form>
        {visibleAdjustments.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {visibleAdjustments.map((a) => (
              <li key={a.id} className="flex min-h-11 items-center justify-between gap-2 py-2">
                <span>
                  {monthLabel(a.month)} · {categoryById.get(a.category_id)?.name ?? '?'} · {a.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{formatCents(a.amount_cents)}</span>
                  <Button variant="ghost" onClick={() => deleteAdjustment(a.id)}>
                    Verwijderen
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
