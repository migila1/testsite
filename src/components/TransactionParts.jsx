import { formatCents } from '../lib/money.js'

export function TxAmount({ cents, className = '' }) {
  const negative = cents < 0
  return (
    <span className={`tabular-nums font-medium ${negative ? 'text-red-700' : 'text-emerald-700'} ${className}`}>
      {formatCents(cents)}
    </span>
  )
}

export function TxRow({
  tx,
  categoryName,
  categoryColor,
  onSelect,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}) {
  const hasCategoryColor = Boolean(categoryColor)
  const handleClick = () => {
    if (selectionMode) onToggleSelect?.(tx)
    else onSelect?.(tx)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selectionMode ? selected : undefined}
      className={`flex w-full min-h-11 items-start gap-3 rounded-xl py-2 pr-2 text-left hover:bg-slate-50 active:bg-slate-100 ${
        selectionMode && selected ? 'bg-teal-50/80 ring-1 ring-teal-200' : ''
      } ${hasCategoryColor ? 'border-l-4 pl-3' : 'pl-2'}`}
      style={hasCategoryColor ? { borderLeftColor: categoryColor } : undefined}
    >
      {selectionMode && (
        <span className="flex shrink-0 items-center self-center" aria-hidden>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded border ${
              selected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
            }`}
          >
            {selected ? '✓' : ''}
          </span>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{tx.description}</p>
        <p className="text-xs text-slate-500">
          {tx.booking_date}
          {categoryName ? ` · ${categoryName}` : ''}
        </p>
      </div>
      <TxAmount cents={tx.amount_cents} />
    </button>
  )
}
