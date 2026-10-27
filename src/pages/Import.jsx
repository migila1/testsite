import { useEffect, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { parseIngCsv } from '../lib/import/ingParser.js'
import { useStore } from '../store.jsx'

function queueId() {
  return crypto.randomUUID()
}

export default function Import() {
  const { accounts, importRows } = useStore()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [queue, setQueue] = useState([])
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    if (!accountId && accounts[0]?.id) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  const onFiles = async (fileList) => {
    const files = [...fileList]
    const added = []
    for (const file of files) {
      const text = await file.text()
      const { rows, errors } = parseIngCsv(text)
      added.push({
        id: queueId(),
        accountId: accountId || accounts[0]?.id,
        fileName: file.name,
        rows,
        errors,
      })
    }
    setQueue((q) => [...q, ...added])
    setLastResult(null)
  }

  const updateQueueAccount = (id, nextAccountId) => {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, accountId: nextAccountId } : item)))
  }

  const removeFromQueue = (id) => setQueue((q) => q.filter((item) => item.id !== id))

  const runImport = async () => {
    if (!queue.length) return
    setBusy(true)
    setLastResult(null)
    try {
      let inserted = 0
      let skipped = 0
      for (const item of queue) {
        if (!item.accountId || !item.rows.length) continue
        const r = await importRows(item.accountId, item.rows)
        inserted += r.inserted
        skipped += r.skipped
      }
      setLastResult({ inserted, skipped, files: queue.length })
      setQueue([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="ING CSV importeren">
        <p className="mb-3 text-sm text-slate-600">
          Upload per rekening een export (.csv, puntkomma). Je kunt meerdere bestanden in de wachtrij zetten (bijv. twee
          ING-rekeningen). Duplicaten op dezelfde rekening worden overgeslagen via fingerprint.
        </p>
        {accounts.length < 2 && (
          <p className="mb-3 text-sm text-amber-800">
            Tip: voeg onder Rekeningen een tweede rekening toe met IBAN — overboekingen tussen eigen rekeningen worden
            dan herkend en niet meegeteld in totalen.
          </p>
        )}
        <label className="mb-3 block text-sm">
          Standaard rekening voor nieuwe bestanden
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.iban ? `(${a.iban})` : ''}
              </option>
            ))}
          </select>
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          multiple
          className="min-h-11 w-full text-sm"
          onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
        />

        {queue.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Wachtrij ({queue.length})</p>
            <ul className="space-y-2 text-sm">
              {queue.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-medium">{item.fileName}</p>
                  <p className="text-xs text-slate-500">{item.rows.length} regels</p>
                  {item.errors?.length > 0 && (
                    <p className="text-xs text-amber-700">{item.errors.length} parse-waarschuwing(en)</p>
                  )}
                  <label className="mt-2 block text-xs">
                    Rekening
                    <select
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
                      value={item.accountId}
                      onChange={(e) => updateQueueAccount(item.id, e.target.value)}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button variant="ghost" className="mt-2" onClick={() => removeFromQueue(item.id)}>
                    Verwijderen
                  </Button>
                </li>
              ))}
            </ul>
            <Button onClick={runImport} disabled={busy}>
              {busy ? 'Bezig…' : `Importeer ${queue.length} bestand(en)`}
            </Button>
          </div>
        )}

        {lastResult && (
          <p className="mt-3 text-sm text-emerald-800">
            {lastResult.files} bestand(en): {lastResult.inserted} toegevoegd, {lastResult.skipped} duplicaat overgeslagen.
            Interne overboekingen tussen je rekeningen zijn gemarkeerd.
          </p>
        )}
      </Card>
    </div>
  )
}
