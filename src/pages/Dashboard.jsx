import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '../components/ui/Card.jsx'
import { formatCents } from '../lib/money.js'
import { filterForReports, monthlyTotals, sumByCategory } from '../lib/stats.js'
import { useStore } from '../store.jsx'

export default function Dashboard() {
  const { transactions, categoryById, loading } = useStore()
  const report = filterForReports(transactions)
  const byCat = sumByCategory(transactions).map(({ categoryId, totalCents }) => ({
    name: categoryId === '__geen__' ? 'Geen categorie' : categoryById.get(categoryId)?.name ?? 'Onbekend',
    total: totalCents / 100,
  }))
  const months = monthlyTotals(transactions)
  const expense = report.filter((t) => t.amount_cents < 0).reduce((s, t) => s + Math.abs(t.amount_cents), 0)
  const income = report.filter((t) => t.amount_cents > 0).reduce((s, t) => s + t.amount_cents, 0)

  if (loading) return <p className="text-slate-600">Laden…</p>

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Overzicht">
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
      </Card>

      <Card title="Uitgaven per categorie">
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCat} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCents(Math.round(v * 100))} />
              <Bar dataKey="total" fill="#0f766e" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Per maand" className="lg:col-span-2">
        <ul className="divide-y divide-slate-100 text-sm">
          {months.length === 0 && <li className="py-2 text-slate-500">Nog geen data.</li>}
          {months.map((m) => (
            <li key={m.month} className="flex min-h-11 items-center justify-between py-2">
              <span>{m.month}</span>
              <span className="text-slate-600">
                {formatCents(m.income)} / {formatCents(-m.expense)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
