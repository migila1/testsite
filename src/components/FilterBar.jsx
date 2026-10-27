import { SORT_OPTIONS } from '../lib/sortTransactions.js'

export default function FilterBar({
  search,
  onSearch,
  categoryId,
  onCategory,
  categories,
  month,
  onMonth,
  sort,
  onSort,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
      <label className="flex min-h-11 flex-1 flex-col gap-1 text-sm">
        <span className="text-slate-600">Zoeken</span>
        <input
          className="min-h-11 rounded-xl border border-slate-200 px-3"
          placeholder="Omschrijving…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      <label className="flex min-h-11 flex-col gap-1 text-sm md:w-48">
        <span className="text-slate-600">Categorie</span>
        <select className="min-h-11 rounded-xl border border-slate-200 px-3" value={categoryId} onChange={(e) => onCategory(e.target.value)}>
          <option value="">Alle</option>
          <option value="__geen__">Geen categorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 flex-col gap-1 text-sm md:w-40">
        <span className="text-slate-600">Maand</span>
        <input
          type="month"
          className="min-h-11 rounded-xl border border-slate-200 px-3"
          value={month}
          onChange={(e) => onMonth(e.target.value)}
        />
      </label>
      <label className="flex min-h-11 flex-col gap-1 text-sm md:w-56">
        <span className="text-slate-600">Sorteren</span>
        <select className="min-h-11 rounded-xl border border-slate-200 px-3" value={sort} onChange={(e) => onSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
