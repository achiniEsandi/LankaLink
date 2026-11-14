import { LogOut, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import RequireRole from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Logo from './components/Logo'
import SiteFooter from './components/SiteFooter'
import Home from './pages/Home'
import Professionals from './pages/Professionals'
import Login from './pages/Login'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderDocuments from './pages/ProviderDocuments'
import ProviderProfileEdit from './pages/ProviderProfileEdit'
import ProviderPublicProfile from './pages/ProviderPublicProfile'
import VerifyEmail from './pages/VerifyEmail'
import AdminProviderDetail from './pages/admin/AdminProviderDetail'
import AdminProviders from './pages/admin/AdminProviders'
import ProviderRegister from './pages/ProviderRegister'
import './App.css'

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const home = user?.role === 'admin' ? '/admin/providers' : user?.role === 'provider' ? '/provider/dashboard' : null

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="brand" aria-label="LankaLink home">
          <Logo />
        </Link>
        <span className="location-chip">
          <MapPin size={15} aria-hidden="true" /> Colombo &amp; Gampaha
        </span>

        <nav className="nav" aria-label="Main">
          {user ? (
            <>
              {user.role === 'admin' && <NavLink to="/admin/providers">Providers</NavLink>}
              <Link to={home ?? '/'} className="account-pill">
                <span className="account-pill__avatar" aria-hidden="true">
                  {user.name.trim()[0]?.toUpperCase()}
                </span>
                <span className="account-pill__name">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                className="icon-link"
                onClick={() => {
                  signOut()
                  navigate('/')
                }}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <a href="/#services" className="nav__hide-sm">
                Services
              </a>
              <NavLink to="/professionals">For professionals</NavLink>
              <NavLink to="/login" className="btn btn--ink btn--small">
                Log in
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function App() {
  return (
    <>
      <ScrollManager />
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/professionals" element={<Professionals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/provider/register" element={<ProviderRegister />} />
          <Route
            path="/provider/dashboard"
            element={
              <RequireRole role="provider">
                <ProviderDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/provider/documents"
            element={
              <RequireRole role="provider">
                <ProviderDocuments />
              </RequireRole>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <RequireRole role="provider">
                <ProviderProfileEdit />
              </RequireRole>
            }
          />
          <Route path="/providers/:id" element={<ProviderPublicProfile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/admin/providers"
            element={
              <RequireRole role="admin">
                <AdminProviders />
              </RequireRole>
            }
          />
          <Route
            path="/admin/providers/:id"
            element={
              <RequireRole role="admin">
                <AdminProviderDetail />
              </RequireRole>
            }
          />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  )
}

// New page: start at the top. Links like /#services: scroll to that section once it has rendered.
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }
    let tries = 0
    const timer = setInterval(() => {
      const target = document.getElementById(hash.slice(1))
      if (target || ++tries > 20) {
        clearInterval(timer)
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
    return () => clearInterval(timer)
  }, [pathname, hash])

  return null
}

export default App
