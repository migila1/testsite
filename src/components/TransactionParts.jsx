import { formatCents } from '../lib/money.js'

export function TxAmount({ cents, className = '' }) {
  const negative = cents < 0
  return (
    <span className={`tabular-nums font-medium ${negative ? 'text-red-700' : 'text-emerald-700'} ${className}`}>
      {formatCents(cents)}
    </span>
  )
}

export function TxRow({ tx, categoryName, categoryColor, onSelect }) {
  const hasCategoryColor = Boolean(categoryColor)
  const memo = String(tx.memo ?? '').trim()
  const hoverHint = memo ? `Mededelingen: ${memo}` : undefined

  return (
    <button
      type="button"
      onClick={() => onSelect?.(tx)}
      title={hoverHint}
      className={`flex w-full min-h-11 items-start gap-3 rounded-xl py-2 pr-2 text-left hover:bg-slate-50 active:bg-slate-100 ${
        hasCategoryColor ? 'border-l-4 pl-3' : 'pl-2'
      }`}
      style={hasCategoryColor ? { borderLeftColor: categoryColor } : undefined}
    >
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
