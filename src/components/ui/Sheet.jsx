import { useEffect } from 'react'
import Button from './Button.jsx'

export default function Sheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Sluiten" onClick={onClose} />
      <div
        className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+var(--safe-bottom))] shadow-xl lg:rounded-2xl"
        style={{ paddingTop: 'calc(1rem + var(--safe-top))' }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Sluiten">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
