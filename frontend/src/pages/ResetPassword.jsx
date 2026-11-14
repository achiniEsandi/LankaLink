import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { HOME_BY_ROLE } from '../auth/homeByRole'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [linkError, setLinkError] = useState(token ? null : 'This reset link is incomplete.')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { token: session, user } = await api('/auth/reset-password', { method: 'POST', body: { token, password } })
      signIn(session, user)
      navigate(HOME_BY_ROLE[user.role] || '/', { replace: true })
    } catch (err) {
      if (err.details?.password) setError(err.details.password)
      else setLinkError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (linkError) {
    return (
      <div className="auth">
        <h1>Link not working</h1>
        <p className="alert alert--error" role="alert">
          {linkError} Reset links work once, for 1 hour.
        </p>
        <Link to="/forgot-password" className="btn btn--primary btn--block">
          Send a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="auth">
      <h1>Choose a new password</h1>
      <p className="muted">You will be logged in once it is saved.</p>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="New password" hint="At least 8 characters" error={error}>
          {(p) => (
            <PasswordInput {...p} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          )}
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
