import { useCallback, useEffect, useState } from 'react'

const DEFAULT = 'dashboard'

export function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return raw || DEFAULT
}

export function navigate(path) {
  const clean = path === DEFAULT ? '' : path.replace(/^\//, '')
  window.location.hash = clean ? `#/${clean}` : '#/'
}

export function useRouter() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const sync = () => setRoute(parseHash())
    if (!window.location.hash) window.location.hash = '#/'
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const go = useCallback((path) => navigate(path), [])

  return { route, navigate: go }
}

export const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transacties', icon: '💳' },
  { id: 'import', label: 'Importeren', icon: '📥' },
  { id: 'categories', label: 'Categorieën', icon: '🏷️' },
  { id: 'accounts', label: 'Rekeningen', icon: '🏦' },
  { id: 'rules', label: 'Regels', icon: '⚙️' },
  { id: 'duplicates', label: 'Duplicaten', icon: '🔁' },
  { id: 'settings', label: 'Instellingen', icon: '🔧' },
]
