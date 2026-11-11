import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'

const STATUS_COPY = {
  pending: {
    title: 'Your account is awaiting verification',
    body: 'Our team will review your details and documents. You will be able to receive bookings once approved.',
  },
  approved: { title: 'Your account is verified', body: 'You can now receive bookings from customers.' },
  rejected: { title: 'Your application needs changes', body: 'Please review the reason below, update your details and resubmit.' },
  suspended: { title: 'Your account is suspended', body: 'Contact LankaLink support for more information.' },
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { token, signOut } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api('/providers/me', { token })
      .then(setData)
      .catch((err) => {
        if (err.status === 401) {
          signOut()
          navigate('/login', { replace: true })
        } else {
          setError(err.message)
        }
      })
  }, [token, signOut, navigate])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading…</p>

  const { user, provider } = data
  const copy = STATUS_COPY[provider.status]

  return (
    <section className="card card--wide">
      <h1>Welcome, {user.name}</h1>

      <div className={`status-banner status-banner--${provider.status}`}>
        <strong>{copy.title}</strong>
        <p>{copy.body}</p>
        {provider.status === 'rejected' && provider.rejectionReason && <p>Reason: {provider.rejectionReason}</p>}
      </div>

      <dl className="details">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Mobile</dt>
        <dd>{user.phone}</dd>
        <dt>NIC</dt>
        <dd>{provider.nic}</dd>
        <dt>Services</dt>
        <dd>{provider.services.map((s) => s.replaceAll('_', ' ')).join(', ')}</dd>
        <dt>Districts</dt>
        <dd>{provider.serviceAreas.join(', ')}</dd>
        <dt>Experience</dt>
        <dd>{provider.experienceYears} years</dd>
      </dl>

      <p className="muted">Next step: uploading your NIC and police report will be available here soon.</p>
    </section>
  )
}
