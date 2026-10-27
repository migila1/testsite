import { ROUTES, useRouter } from '../lib/router.js'

export default function Layout({ children }) {
  const { route, navigate } = useRouter()

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-3 py-4 lg:block">
        <p className="mb-4 px-2 text-lg font-bold text-teal-800">Mijn Uitgaven</p>
        <nav className="flex flex-col gap-1">
          {ROUTES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm ${
                route === item.id ? 'bg-teal-50 font-semibold text-teal-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
          <h1 className="text-lg font-bold text-teal-800">{ROUTES.find((r) => r.id === route)?.label ?? 'Mijn Uitgaven'}</h1>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 lg:pb-4">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {ROUTES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.id)}
            className={`flex min-h-11 min-w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] ${
              route === item.id ? 'font-semibold text-teal-800' : 'text-slate-600'
            }`}
          >
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            <span className="max-w-full truncate">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
