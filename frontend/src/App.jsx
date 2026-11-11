import { Link, NavLink, Route, Routes, useNavigate } from 'react-router'
import RequireRole from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderRegister from './pages/ProviderRegister'
import './App.css'

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="header">
      <Link to="/" className="brand">LankaLink</Link>
      <nav className="nav">
        {user ? (
          <>
            {user.role === 'provider' && <NavLink to="/provider/dashboard">Dashboard</NavLink>}
            <button
              type="button"
              className="btn btn--link"
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
            <NavLink to="/provider/register">Become a provider</NavLink>
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
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

export default App
