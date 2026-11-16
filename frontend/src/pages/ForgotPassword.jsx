import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import Field from '../components/Field'
import { EMAIL_PATTERN } from '../lib/customer'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter the email address you signed up with')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="auth">
        <h1>Check your email</h1>
        <p className="muted">
          If an account exists for <strong>{email.trim()}</strong>, we have sent a link to reset your password. The
          link works for 1 hour. Check your spam folder if you cannot see it.
        </p>
        <p className="auth__alt">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth">
      <h1>Forgot your password?</h1>
      <p className="muted">Enter your email and we will send you a link to choose a new one.</p>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email address" error={error}>
          {(p) => (
            <input {...p} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          )}
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="auth__alt">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
