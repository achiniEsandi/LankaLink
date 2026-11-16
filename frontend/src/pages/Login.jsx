import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { api } from '../api/client'
import { HOME_BY_ROLE } from '../auth/homeByRole'
import { useAuth } from '../auth/useAuth'
import { CircleCheck } from 'lucide-react'
import Field from '../components/Field'
import HomeScene from '../components/illustrations/HomeScene'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email: email.trim(), password } })
      signIn(token, user)
      navigate(location.state?.from || HOME_BY_ROLE[user.role] || '/', { replace: true })
    } catch (err) {
      // The server explains lockouts and remaining attempts, so show its message as is
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-split">
      <div className="auth">
      <h1>Log in</h1>
      <p className="muted">Welcome back to LankaLink.</p>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email address">
          {(p) => (
            <input {...p} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          )}
        </Field>
        <Field label="Password">
          {(p) => (
            <PasswordInput {...p} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          )}
        </Field>
        <p className="auth__forgot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <div className="auth__alt">
        <p>
          New here?{' '}
          <Link to="/signup" state={location.state}>
            Create a customer account
          </Link>
        </p>
        <p className="muted small">
          Looking for work? <Link to="/provider/register">Sign up as a service provider</Link>
        </p>
      </div>
      </div>

      {/* The login is shared, so speak to families abroad and providers alike */}
      <aside className="auth-aside" aria-hidden="true">
        <HomeScene />
        <ul>
          <li>
            <CircleCheck size={18} /> Book verified help for your home and family
          </li>
          <li>
            <CircleCheck size={18} /> See check-ins, photos and a report after every visit
          </li>
          <li>
            <CircleCheck size={18} /> Providers: track your application and job requests
          </li>
        </ul>
      </aside>
    </div>
  )
}
