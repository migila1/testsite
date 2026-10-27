import { useMemo } from 'react'
import Card from '../components/ui/Card.jsx'
import { TxRow } from '../components/TransactionParts.jsx'
import { fingerprintBaseKey } from '../lib/fingerprint.js'
import { useStore } from '../store.jsx'

export default function Duplicates() {
  const { transactions, categoryById } = useStore()

  const groups = useMemo(() => {
    const map = new Map()
    for (const tx of transactions) {
      const key = `${tx.account_id}|${fingerprintBaseKey({
        accountId: tx.account_id,
        bookingDate: tx.booking_date,
        amountCents: tx.amount_cents,
        description: tx.description,
        counterpartyIban: tx.counterparty_iban,
      })}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(tx)
    }
    return [...map.values()].filter((g) => g.length > 1)
  }, [transactions])

  return (
    <Card title="Mogelijke duplicaten">
      {groups.length === 0 ? (
        <p className="text-sm text-slate-600">Geen dubbele base-keys gevonden.</p>
      ) : (
        <ul className="space-y-4">
          {groups.map((group) => (
            <li key={group.map((t) => t.id).join('-')} className="rounded-xl border border-amber-200 bg-amber-50/50 p-2">
              <p className="mb-2 text-xs font-medium text-amber-900">{group.length} vergelijkbare transacties</p>
              <ul className="divide-y divide-amber-100">
                {group.map((tx) => (
                  <li key={tx.id}>
                    <TxRow
                      tx={tx}
                      categoryName={tx.category_id ? categoryById.get(tx.category_id)?.name : null}
                      categoryColor={tx.category_id ? categoryById.get(tx.category_id)?.color : null}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
