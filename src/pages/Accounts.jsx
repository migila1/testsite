import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useStore } from '../store.jsx'

export default function Accounts() {
  const { accounts, saveAccount, deleteAccount } = useStore()
  const [name, setName] = useState('')
  const [iban, setIban] = useState('')

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await saveAccount({ name: name.trim(), iban: iban.trim(), currency: 'EUR' })
    setName('')
    setIban('')
  }

  return (
    <div className="space-y-4">
      <Card title="Rekening toevoegen">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Naam
            <input className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm sm:col-span-2">
            IBAN
            <input className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="NL…" />
          </label>
          <Button type="submit">Opslaan</Button>
        </form>
      </Card>
      <Card title="Rekeningen">
        <ul className="divide-y divide-slate-100">
          {accounts.map((a) => (
            <li key={a.id} className="flex min-h-11 items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-slate-500">{a.iban}</p>
              </div>
              <Button variant="ghost" onClick={() => deleteAccount(a.id)}>
                Verwijderen
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
