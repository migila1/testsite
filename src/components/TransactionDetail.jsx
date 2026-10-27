import { enrichTransaction } from '../lib/enrichTransaction.js'
import { formatCents } from '../lib/money.js'
import { TxAmount } from './TransactionParts.jsx'

function formatDateNl(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}-${m}-${y}`
}

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{children}</dd>
    </div>
  )
}

export default function TransactionDetail({ tx, categoryName }) {
  const view = enrichTransaction(tx)
  const memo = String(view.memo ?? '').trim()

  return (
    <dl className="divide-y divide-slate-100">
      <DetailRow label="Bedrag">
        <TxAmount cents={tx.amount_cents} className="text-lg" />
      </DetailRow>
      <DetailRow label="Datum">{formatDateNl(view.booking_date)}</DetailRow>
      <DetailRow label="Tijd">{view.booking_time?.trim() || '—'}</DetailRow>
      <DetailRow label="Type">{view.mutation_type?.trim() || '—'}</DetailRow>
      <DetailRow label="Omschrijving">
        <span className="select-text break-words">{view.description?.trim() || '—'}</span>
      </DetailRow>
      <DetailRow label="Tegenrekening">
        <div className="select-text space-y-1 break-all">
          {view.counterparty_name?.trim() && <p>{view.counterparty_name}</p>}
          {view.counterparty_iban?.trim() ? (
            <p className="font-mono text-xs text-slate-600">{view.counterparty_iban}</p>
          ) : (
            !view.counterparty_name?.trim() && <p>—</p>
          )}
        </div>
      </DetailRow>
      <DetailRow label="Mededelingen">
        <p
          className={`select-text whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-slate-800 ${
            memo ? '' : 'text-slate-400'
          }`}
        >
          {memo || 'Geen mededeling'}
        </p>
      </DetailRow>
      <DetailRow label="Categorie">{categoryName ?? 'Geen categorie'}</DetailRow>
    </dl>
  )
}
