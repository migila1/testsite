import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useStore } from '../store.jsx'

export default function Categories() {
  const { categories, saveCategory, deleteCategory } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0f766e')

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await saveCategory({ name: name.trim(), color, sort_order: categories.length + 1 })
    setName('')
  }

  return (
    <div className="space-y-4">
      <Card title="Nieuwe categorie">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            Naam
            <input className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm">
            Kleur
            <input type="color" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 p-1" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <Button type="submit">Toevoegen</Button>
        </form>
      </Card>
      <Card title="Categorieën">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex min-h-11 items-center justify-between gap-2 py-2">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <Button variant="ghost" onClick={() => deleteCategory(c.id)}>
                Verwijderen
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
