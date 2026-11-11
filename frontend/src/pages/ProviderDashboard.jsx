import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { DocumentsSpot, VerifiedSpot } from '../components/illustrations/Spots'
import { experienceLabel } from '../lib/provider'
import { SERVICE_ICONS } from '../lib/serviceIcons'

// Where the provider is in the journey from sign-up to receiving jobs
function journeyFor(status) {
  const verified = status === 'approved'
  return [
    { title: 'Create your account', text: 'Done. Thank you for signing up.', state: 'done' },
    {
      title: 'Upload your documents',
      text: 'A clear photo of your NIC (both sides) and your police clearance report.',
      state: verified ? 'done' : 'current',
      action: verified ? null : 'Document upload opens here soon',
    },
    {
      title: 'We check your details',
      text: 'Usually within 2 working days. We may call you to confirm a few things.',
      state: verified ? 'done' : 'todo',
    },
    {
      title: 'Start receiving jobs',
      text: 'Job requests from customers in your districts will appear here.',
      state: verified ? 'current' : 'todo',
    },
  ]
}

const STATUS_NOTICE = {
  rejected: {
    tone: 'error',
    title: 'Some details need fixing',
    text: 'Please update the items below and send your application again.',
  },
  suspended: {
    tone: 'error',
    title: 'Your account is paused',
    text: 'You will not receive new jobs for now. Call us on 070 267 8393 if you think this is a mistake.',
  },
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, signOut } = useAuth()
  const [data, setData] = useState(null)
  const [labels, setLabels] = useState({})
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
    api('/providers/options')
      .then((o) => setLabels(Object.fromEntries(o.services.map((s) => [s.value, s.label]))))
      .catch(() => {})
  }, [token, signOut, navigate])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading your account…</p>

  const { user, provider } = data
  const firstName = user.name.split(' ')[0]
  const notice = STATUS_NOTICE[provider.status]
  const journey = journeyFor(provider.status)

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div>
          <h1>{location.state?.justRegistered ? `Welcome to LankaLink, ${firstName}` : `Hello, ${firstName}`}</h1>
          <p className="muted">
            {provider.status === 'approved'
              ? 'Your account is verified.'
              : 'Your application is in progress. Here is what happens next.'}
          </p>
        </div>
        <div className="dashboard__art">{provider.status === 'approved' ? <VerifiedSpot /> : <DocumentsSpot />}</div>
      </header>

      {notice && (
        <div className={`alert alert--${notice.tone}`} role="status">
          <strong>{notice.title}</strong>
          <p>{notice.text}</p>
          {provider.rejectionReason && <p>Reason: {provider.rejectionReason}</p>}
        </div>
      )}

      <div className="dashboard__grid">
        <section className="panel">
          <h2 className="panel__title">Your application</h2>
          <ol className="journey">
            {journey.map((s, i) => (
              <li key={s.title} className={`journey__step journey__step--${s.state}`}>
                <span className="journey__marker" aria-hidden="true">{s.state === 'done' ? '✓' : i + 1}</span>
                <div>
                  <p className="journey__title">
                    {s.title}
                    {s.state === 'current' && <span className="tag">Next</span>}
                  </p>
                  <p className="journey__text">{s.text}</p>
                  {s.action && (
                    <button type="button" className="btn btn--primary btn--small" disabled>
                      {s.action}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel">
          <h2 className="panel__title">Your profile</h2>
          <dl className="profile">
            <dt>Name</dt>
            <dd>{user.name}</dd>
            <dt>Mobile</dt>
            <dd>{user.phone}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>NIC</dt>
            <dd>{provider.nic}</dd>
            <dt>Work</dt>
            <dd className="service-list">
              {provider.services.map((s) => {
                const Icon = SERVICE_ICONS[s]
                return (
                  <span key={s} className="service-chip">
                    {Icon && <Icon size={15} aria-hidden="true" />}
                    {labels[s] ?? s}
                  </span>
                )
              })}
            </dd>
            <dt>Experience</dt>
            <dd>{experienceLabel(provider.experienceYears)}</dd>
            <dt>Districts</dt>
            <dd>{provider.serviceAreas.join(', ')}</dd>
          </dl>
          <p className="muted small">Need to change something? Call us on 070 267 8393.</p>
        </section>
      </div>
    </div>
  )
}
