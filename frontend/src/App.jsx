import { Link, NavLink, Route, Routes, useNavigate } from 'react-router'
import { HOME_BY_ROLE } from './auth/homeByRole'
import RequireRole from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Logo from './components/Logo'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerProfile from './pages/CustomerProfile'
import CustomerRegister from './pages/CustomerRegister'
import FamilyMemberForm from './pages/FamilyMemberForm'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login'
import PropertyForm from './pages/PropertyForm'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderRegister from './pages/ProviderRegister'
import ResetPassword from './pages/ResetPassword'
import Services from './pages/Services'
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
        {user?.role !== 'provider' && <NavLink to="/services">Services</NavLink>}
        {user ? (
          <>
            <span className="nav__user">{user.name.split(' ')[0]}</span>
            {HOME_BY_ROLE[user.role] && <NavLink to={HOME_BY_ROLE[user.role]}>My account</NavLink>}
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

const customerOnly = (page) => <RequireRole role="customer">{page}</RequireRole>

function App() {
  return (
    <>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/services" element={<Services />} />

          <Route path="/signup" element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={customerOnly(<CustomerDashboard />)} />
          <Route path="/customer/profile" element={customerOnly(<CustomerProfile />)} />
          <Route path="/customer/properties/new" element={customerOnly(<PropertyForm />)} />
          <Route path="/customer/properties/:id" element={customerOnly(<PropertyForm />)} />
          <Route path="/customer/family/new" element={customerOnly(<FamilyMemberForm />)} />
          <Route path="/customer/family/:id" element={customerOnly(<FamilyMemberForm />)} />

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
