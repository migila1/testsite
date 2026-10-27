import { useState } from 'react'
import CategoryNameInput from '../components/CategoryNameInput.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { findExactCategory } from '../lib/categorySuggest.js'
import { useStore } from '../store.jsx'

export default function Categories() {
  const { categories, saveCategory, deleteCategory } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0f766e')

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (findExactCategory(name, categories)) return
    await saveCategory({ name: name.trim(), color, sort_order: categories.length + 1 })
    setName('')
  }

  return (
    <div className="space-y-4">
      <Card title="Nieuwe categorie">
        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            Naam
            <CategoryNameInput value={name} onChange={setName} categories={categories} />
          </label>
          <label className="text-sm">
            Kleur
            <input type="color" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 p-1" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <Button type="submit" disabled={Boolean(findExactCategory(name, categories))}>
            Toevoegen
          </Button>
        </form>
      </Card>
      <Card title="Categorieën">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="truncate font-medium">{c.name}</span>
              </span>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`cat-color-${c.id}`}>
                  Kleur van {c.name}
                </label>
                <input
                  id={`cat-color-${c.id}`}
                  type="color"
                  className="min-h-11 w-14 cursor-pointer rounded-xl border border-slate-200 p-1"
                  value={c.color ?? '#64748b'}
                  onChange={(e) => saveCategory({ ...c, color: e.target.value })}
                />
                <Button variant="ghost" onClick={() => deleteCategory(c.id)}>
                  Verwijderen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
