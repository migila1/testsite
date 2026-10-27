import Card from '../components/ui/Card.jsx'
import { useStore } from '../store.jsx'

export default function Settings() {
  const { db, error } = useStore()
  const demo = db.mode === 'demo'

  return (
    <div className="space-y-4">
      <Card title="Instellingen">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Opslag</dt>
            <dd className="font-medium">{demo ? 'Demo (localStorage)' : 'Supabase'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Supabase URL</dt>
            <dd className="break-all font-mono text-xs">{import.meta.env.VITE_SUPABASE_URL || '—'}</dd>
          </div>
        </dl>
        {demo && (
          <p className="mt-3 text-sm text-slate-600">
            Zet <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> en{' '}
            <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> als build-variabelen in Coolify. Geen
            service_role in de frontend.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </Card>
      <Card title="PWA">
        <p className="text-sm text-slate-600">Voeg toe aan beginscherm voor app-ervaring. Service worker cached alleen de app-shell.</p>
      </Card>
    </div>
  )
}
