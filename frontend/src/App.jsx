import { LogOut, MapPin } from 'lucide-react'
import { Suspense, lazy, useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import RequireRole from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Logo from './components/Logo'
import SiteFooter from './components/SiteFooter'
import BookService from './pages/BookService'
import BookingDetail from './pages/BookingDetail'
import Home from './pages/Home'
import MyBookings from './pages/MyBookings'
import ProviderJobs from './pages/ProviderJobs'
import AdminBookings from './pages/admin/AdminBookings'
import Professionals from './pages/Professionals'
import Login from './pages/Login'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderDocuments from './pages/ProviderDocuments'
import ProviderProfileEdit from './pages/ProviderProfileEdit'
import ProviderPublicProfile from './pages/ProviderPublicProfile'
import ProviderReviews from './pages/ProviderReviews'
import VerifyEmail from './pages/VerifyEmail'
import WriteReview from './pages/WriteReview'
import AdminReviews from './pages/admin/AdminReviews'
import AdminProviderDetail from './pages/admin/AdminProviderDetail'
import AdminProviders from './pages/admin/AdminProviders'
import ProviderRegister from './pages/ProviderRegister'
import './App.css'

// Ahmed's analytics, GPS and evidence preview: loaded only when opened, with its own styles
const OperationsHub = lazy(() => import('./pages/operations/OperationsHub'))

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const home = { admin: '/admin/providers', provider: '/provider/dashboard', customer: '/bookings' }[user?.role] ?? null

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
              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin/providers">Providers</NavLink>
                  <NavLink to="/admin/bookings">Bookings</NavLink>
                  <NavLink to="/operations">Operations</NavLink>
                  <NavLink to="/admin/reviews">Reviews</NavLink>
                </>
              )}
              {user.role === 'provider' && (
                <NavLink to="/provider/jobs" className="nav__hide-sm">
                  My jobs
                </NavLink>
              )}
              {user.role === 'customer' && (
                <>
                  <NavLink to="/bookings" end className="nav__hide-sm">
                    My bookings
                  </NavLink>
                  <NavLink to="/book" className="btn btn--ink btn--small">
                    Book
                  </NavLink>
                </>
              )}
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
  const { pathname } = useLocation()

  // The operations preview is a full-screen dashboard with its own navigation
  if (pathname.startsWith('/operations')) {
    return (
      <RequireRole role="admin">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <OperationsHub />
        </Suspense>
      </RequireRole>
    )
  }

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
          <Route
            path="/provider/jobs"
            element={
              <RequireRole role="provider">
                <ProviderJobs />
              </RequireRole>
            }
          />
          <Route
            path="/book"
            element={
              <RequireRole role="customer">
                <BookService />
              </RequireRole>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireRole role="customer">
                <MyBookings />
              </RequireRole>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <RequireRole role="customer">
                <BookingDetail />
              </RequireRole>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RequireRole role="admin">
                <AdminBookings />
              </RequireRole>
            }
          />
          <Route path="/providers/:id" element={<ProviderPublicProfile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/provider/reviews"
            element={
              <RequireRole role="provider">
                <ProviderReviews />
              </RequireRole>
            }
          />
          <Route
            path="/reviews/new"
            element={
              <RequireRole role="customer">
                <WriteReview />
              </RequireRole>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <RequireRole role="admin">
                <AdminReviews />
              </RequireRole>
            }
          />
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
