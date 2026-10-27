import { AuthProvider, useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import { useRouter } from './lib/router.js'
import Login from './pages/Login.jsx'
import Accounts from './pages/Accounts.jsx'
import Categories from './pages/Categories.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Duplicates from './pages/Duplicates.jsx'
import Import from './pages/Import.jsx'
import Rules from './pages/Rules.jsx'
import Settings from './pages/Settings.jsx'
import Transactions from './pages/Transactions.jsx'
import { StoreProvider, useStore } from './store.jsx'

const PAGES = {
  dashboard: Dashboard,
  transactions: Transactions,
  import: Import,
  categories: Categories,
  accounts: Accounts,
  rules: Rules,
  duplicates: Duplicates,
  settings: Settings,
}

function RouterView() {
  const { route } = useRouter()
  const { authRequired, user, authReady } = useAuth()
  const { ready, error } = useStore()
  const Page = PAGES[route] ?? Dashboard

  if (!authReady || (authRequired && !user)) {
    if (authReady && authRequired && !user) return <Login />
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600">
        Laden…
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-600">
        Laden…
      </div>
    )
  }

  return (
    <Layout>
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      <Page />
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <RouterView />
      </StoreProvider>
    </AuthProvider>
  )
}
