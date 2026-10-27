export default function Card({ title, children, className = '', action }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex min-h-11 items-center justify-between gap-2">
          {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : <span />}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
