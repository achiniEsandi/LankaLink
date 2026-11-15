import { Mail } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'

// Shown until the provider clicks the link in their confirmation email
export default function VerifyEmailBanner({ email, token }) {
  const [state, setState] = useState(null)

  async function resend() {
    setState({ busy: true })
    try {
      await api('/auth/resend-verification', { method: 'POST', token })
      setState({ ok: `We sent a new link to ${email}. Check your spam folder too.` })
    } catch (err) {
      setState({ error: err.message })
    }
  }

  return (
    <div className="verify-banner" role="status">
      <Mail size={22} aria-hidden="true" />
      <div className="verify-banner__text">
        <strong>Confirm your email address</strong>
        <p>
          We sent a link to <strong>{email}</strong>. Open it to confirm this is your email. We can only approve your
          application after that.
        </p>
        {state?.ok && <p className="verify-banner__ok">{state.ok}</p>}
        {state?.error && <p className="field__error">{state.error}</p>}
      </div>
      <button type="button" className="btn btn--ghost btn--small" onClick={resend} disabled={state?.busy}>
        {state?.busy ? 'Sending…' : 'Send the email again'}
      </button>
    </div>
  )
}
