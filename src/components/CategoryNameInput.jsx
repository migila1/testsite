import { useId, useMemo, useState } from 'react'
import { findCategorySuggestions, findExactCategory } from '../lib/categorySuggest.js'

export default function CategoryNameInput({
  value,
  onChange,
  categories,
  onUseExisting,
  placeholder = 'Naam categorie',
  className = '',
  inputClassName = 'mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3',
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => findCategorySuggestions(value, categories), [value, categories])
  const exact = useMemo(() => findExactCategory(value, categories), [value, categories])

  const pick = (cat) => {
    if (onUseExisting) {
      onUseExisting(cat)
    } else {
      onChange(cat.name)
    }
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <input
        className={inputClassName}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
      />
      {exact && value.trim() && (
        <p className="mt-1 text-xs text-amber-800">Deze categorie bestaat al — kies hem uit de lijst hieronder.</p>
      )}
      {open && suggestions.length > 0 && !exact && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map(({ category, kind }) => (
            <li key={category.id} role="option">
              <button
                type="button"
                className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-teal-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(category)}
              >
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
                <span className="flex-1 font-medium">{category.name}</span>
                <span className="text-xs text-slate-500">{kind === 'prefix' ? 'Bestaat al' : 'Lijkt hierop'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
