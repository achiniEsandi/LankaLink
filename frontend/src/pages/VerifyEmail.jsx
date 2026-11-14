import { CircleAlert, CircleCheck, Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'

// Opened from the link in the confirmation email
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'checking' })
  const sent = useRef(false)

  useEffect(() => {
    // The token works only once, so never send it twice (React runs effects twice in development)
    if (sent.current) return
    sent.current = true
    api('/auth/verify-email', { method: 'POST', body: { token: params.get('token') ?? '' } })
      .then((d) => setState({ status: 'done', email: d.email }))
      .catch((err) => setState({ status: err.status === 410 ? 'expired' : 'invalid', message: err.message }))
  }, [params])

  const next = user?.role === 'provider' ? '/provider/dashboard' : '/login'
  const nextLabel = user ? 'Go to my account' : 'Log in'

  return (
    <div className="verify">
      {state.status === 'checking' && <p className="muted">Confirming your email…</p>}

      {state.status === 'done' && (
        <>
          <CircleCheck size={48} className="verify__icon verify__icon--ok" aria-hidden="true" />
          <h1>Email confirmed</h1>
          <p className="muted">
            Thank you. <strong>{state.email}</strong> is confirmed, so our team can now review your application.
          </p>
          <Link to={next} className="btn btn--primary">{nextLabel}</Link>
        </>
      )}

      {state.status === 'expired' && (
        <>
          <Clock size={48} className="verify__icon verify__icon--warn" aria-hidden="true" />
          <h1>This link has expired</h1>
          <p className="muted">Links work for 24 hours. Log in and use “Send the email again” on your account page.</p>
          <Link to={next} className="btn btn--primary">{nextLabel}</Link>
        </>
      )}

      {state.status === 'invalid' && (
        <>
          <CircleAlert size={48} className="verify__icon verify__icon--error" aria-hidden="true" />
          <h1>We couldn’t confirm your email</h1>
          <p className="muted">{state.message} If you asked for more than one email, only the newest link works.</p>
          <Link to={next} className="btn btn--primary">{nextLabel}</Link>
        </>
      )}
    </div>
  )
}
