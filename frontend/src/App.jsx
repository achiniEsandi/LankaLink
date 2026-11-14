import { Link, NavLink, Route, Routes, useNavigate } from 'react-router'
import RequireRole from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Logo from './components/Logo'
import Home from './pages/Home'
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

  return (
    <header className="header">
      <Link to="/" className="brand" aria-label="LankaLink home">
        <Logo />
      </Link>
      <nav className="nav">
        {user ? (
          <>
            <span className="nav__user">{user.name.split(' ')[0]}</span>
            {user.role === 'provider' && <NavLink to="/provider/dashboard">My account</NavLink>}
            {user.role === 'admin' && <NavLink to="/admin/providers">Providers</NavLink>}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                signOut()
                navigate('/')
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/provider/register">Work with us</NavLink>
            <NavLink to="/login">Log in</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

function App() {
  return (
    <>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
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
    </>
  )
}

export default App
