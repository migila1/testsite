import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { parseIngCsv } from '../lib/import/ingParser.js'
import { useStore } from '../store.jsx'

export default function Import() {
  const { accounts, importRows } = useStore()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const [allRows, setAllRows] = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file) => {
    const text = await file.text()
    const { rows, errors: parseErrors } = parseIngCsv(text)
    setAllRows(rows)
    setPreview(rows.slice(0, 20))
    setErrors(parseErrors)
    setResult(null)
  }

  const doImport = async () => {
    if (!accountId || !allRows.length) return
    setBusy(true)
    try {
      const r = await importRows(accountId, allRows)
      setResult(r)
      setPreview([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="ING CSV importeren">
        <p className="mb-3 text-sm text-slate-600">Exporteer vanuit ING (.csv, puntkomma). Data wordt niet offline gecached buiten demo-modus.</p>
        <label className="mb-3 block text-sm">
          Rekening
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="min-h-11 w-full text-sm"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {errors.length > 0 && (
          <p className="mt-2 text-sm text-amber-700">{errors.length} parse-waarschuwing(en)</p>
        )}
        {preview.length > 0 && (
          <>
            <p className="mt-3 text-sm">Voorbeeld ({preview.length} van {allRows.length})</p>
            <ul className="mt-2 max-h-48 overflow-auto text-xs text-slate-700">
              {preview.map((r) => (
                <li key={r.id} className="border-b border-slate-100 py-1">
                  {r.booking_date} — {r.description}
                </li>
              ))}
            </ul>
            <Button className="mt-3" onClick={doImport} disabled={busy}>
              {busy ? 'Bezig…' : 'Importeren'}
            </Button>
          </>
        )}
        {result && (
          <p className="mt-3 text-sm text-emerald-800">
            Toegevoegd: {result.inserted}, overgeslagen (duplicaat): {result.skipped}
          </p>
        )}
      </Card>
    </div>
  )
}
