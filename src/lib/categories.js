export function compareCategoryNames(a, b) {
  return (a.name ?? '').localeCompare(b.name ?? '', 'nl', { sensitivity: 'base' })
}

export function sortCategories(categories) {
  return [...categories].sort(compareCategoryNames)
}
