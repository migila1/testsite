import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useStore } from '../store.jsx'

export default function Rules() {
  const { rules, categories, saveRule, deleteRule, reapplyRules } = useStore()
  const [pattern, setPattern] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')

  const add = async (e) => {
    e.preventDefault()
    if (!pattern.trim() || !categoryId) return
    await saveRule({
      pattern: pattern.trim(),
      match_type: 'contains',
      category_id: categoryId,
      priority: 50,
      active: true,
    })
    setPattern('')
  }

  return (
    <div className="space-y-4">
      <Card title="Nieuwe regel">
        <form onSubmit={add} className="grid gap-3">
          <label className="text-sm">
            Bevat tekst
            <input
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="bijv. spotify"
            />
          </label>
          <label className="text-sm">
            Categorie
            <select className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Regel opslaan</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Handmatige categorieën worden nooit overschreven.</p>
      </Card>
      <Card
        title="Regels"
        action={
          <Button variant="secondary" onClick={reapplyRules}>
            Opnieuw toepassen
          </Button>
        }
      >
        <ul className="divide-y divide-slate-100 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex min-h-11 items-center justify-between gap-2 py-2">
              <span>
                “{r.pattern}” → {categories.find((c) => c.id === r.category_id)?.name ?? '?'}
              </span>
              <Button variant="ghost" onClick={() => deleteRule(r.id)}>
                Verwijderen
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
