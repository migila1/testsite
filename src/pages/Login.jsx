import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { signIn, signUp, authError, clearAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    clearAuthError()
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        setInfo('Account aangemaakt. Bevestig je e-mail als Supabase dat vereist, log daarna in.')
        setMode('login')
      }
    } catch {
      /* authError in context */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ paddingTop: 'calc(2rem + var(--safe-top))', paddingBottom: 'calc(2rem + var(--safe-bottom))' }}
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-teal-800">Mijn Uitgaven</h1>
        <p className="mt-1 text-sm text-slate-600">Log in om je gegevens te synchroniseren.</p>
      </div>
      <Card className="w-full max-w-md" title={mode === 'login' ? 'Inloggen' : 'Registreren'}>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Wachtwoord
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {authError && (
            <p className="text-sm text-red-700" role="alert">
              {authError}
            </p>
          )}
          {info && <p className="text-sm text-emerald-800">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Bezig…' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? (
            <>
              Nog geen account?{' '}
              <button type="button" className="min-h-11 font-medium text-teal-800 underline" onClick={() => setMode('register')}>
                Registreren
              </button>
            </>
          ) : (
            <>
              Al een account?{' '}
              <button type="button" className="min-h-11 font-medium text-teal-800 underline" onClick={() => setMode('login')}>
                Inloggen
              </button>
            </>
          )}
        </p>
      </Card>
    </div>
  )
}
