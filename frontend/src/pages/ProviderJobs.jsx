import { BriefcaseBusiness, Check, Clock, MapPin, Phone, Repeat, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { PERIOD_HOURS, formatDay } from '../lib/bookings'
import { PERIOD_LABELS } from '../lib/availability'
import { formatRs } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'
import { useServiceLabels } from '../lib/useServiceLabels'

const TABS = [
  { value: 'requests', label: 'New requests' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Completed' },
]

const JOB_STATUS = { accepted: 'Accepted', checked_in: 'In progress', completed: 'Waiting for customer', confirmed: 'Confirmed' }

// Calendar day in Sri Lanka, "YYYY-MM-DD"
const todaySL = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date())

function hoursLeft(assignedAt) {
  const left = 24 - (Date.now() - new Date(assignedAt).getTime()) / 3_600_000
  return Math.max(0, Math.round(left))
}

function JobCard({ job, labels, busy, onAction }) {
  const Icon = SERVICE_ICONS[job.service]
  const isToday = job.date === todaySL()
  return (
    <article className="panel job-card">
      <header className="job-card__head">
        <span className="booking-row__icon" aria-hidden="true">{Icon && <Icon size={20} />}</span>
        <div className="job-card__title">
          <h3>{labels[job.service] ?? job.service}</h3>
          <p className="booking-row__meta">
            {formatDay(job.date)} · {PERIOD_LABELS[job.period]} ({PERIOD_HOURS[job.period]})
            {isToday && <span className="tag">Today</span>}
          </p>
        </div>
        <p className="job-card__price">{formatRs(job.price)}</p>
      </header>

      <dl className="summary-list">
        <div>
          <dt><MapPin size={14} aria-hidden="true" /> Where</dt>
          <dd>
            {job.location.address ? `${job.location.address}, ${job.location.district}` : `${job.location.district} (full address after you accept)`}
          </dd>
        </div>
        <div>
          <dt>Customer</dt>
          <dd>
            {job.location.contactName && job.location.contactName !== job.customerName
              ? `${job.customerName} · meet ${job.location.contactName}`
              : job.customerName}
            {job.location.contactPhone && (
              <>
                {' · '}
                <a href={`tel:${job.location.contactPhone}`}><Phone size={13} aria-hidden="true" /> {job.location.contactPhone}</a>
              </>
            )}
          </dd>
        </div>
        {job.instructions && (
          <div>
            <dt>Notes</dt>
            <dd>{job.instructions}</dd>
          </div>
        )}
        {job.recurring && (
          <div>
            <dt><Repeat size={14} aria-hidden="true" /> Repeat</dt>
            <dd>Regular visit. Accepting keeps you as this family’s professional.</dd>
          </div>
        )}
      </dl>

      {job.status === 'assigned' && (
        <footer className="job-card__actions">
          <span className="small muted"><Clock size={13} aria-hidden="true" /> Respond within {hoursLeft(job.assignedAt)} h</span>
          <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => onAction(job, 'decline')}>
            <X size={15} aria-hidden="true" /> Decline
          </button>
          <button type="button" className="btn btn--primary btn--small" disabled={busy} onClick={() => onAction(job, 'accept')}>
            <Check size={15} aria-hidden="true" /> Accept
          </button>
        </footer>
      )}
      {job.status === 'accepted' && (
        <footer className="job-card__actions">
          <span className="status-chip status-chip--approved">{JOB_STATUS.accepted}</span>
          {isToday ? (
            <button type="button" className="btn btn--ink btn--small" disabled={busy} onClick={() => onAction(job, 'start')}>
              Check in
            </button>
          ) : (
            <span className="small muted">Check in on the day of the visit</span>
          )}
        </footer>
      )}
      {job.status === 'checked_in' && (
        <footer className="job-card__actions">
          <span className="status-chip status-chip--approved">{JOB_STATUS.checked_in}</span>
          <button type="button" className="btn btn--primary btn--small" disabled={busy} onClick={() => onAction(job, 'complete')}>
            Mark job complete
          </button>
        </footer>
      )}
      {['completed', 'confirmed'].includes(job.status) && (
        <footer className="job-card__actions">
          <span className={`status-chip status-chip--${job.status === 'confirmed' ? 'approved' : 'pending'}`}>{JOB_STATUS[job.status]}</span>
        </footer>
      )}
    </article>
  )
}

// Provider job screen: /provider/jobs
export default function ProviderJobs() {
  const { token } = useAuth()
  const labels = useServiceLabels()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(
    () =>
      api('/bookings/jobs', { token })
        .then(setData)
        .catch((err) => setError(err.message)),
    [token],
  )
  useEffect(() => {
    load()
  }, [load])

  const fallback = data?.requests.length ? 'requests' : data?.upcoming.length ? 'upcoming' : 'requests'
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : fallback

  async function onAction(job, action) {
    if (action === 'decline' && !window.confirm('Decline this job? It will be offered to another professional.')) return
    setBusy(job._id)
    setError(null)
    try {
      await api(`/bookings/jobs/${job._id}/${action}`, { method: 'POST', token })
      setNotice(
        {
          accept: 'Job accepted. It’s now in your upcoming jobs, with the full address.',
          decline: 'Job declined.',
          start: 'Checked in. Mark the job complete when you finish.',
          complete: 'Job marked complete. The customer will be asked to confirm.',
        }[action],
      )
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const list = data?.[tab] ?? []

  return (
    <div className="narrow-page provider-jobs">
      <Link to="/provider/dashboard" className="back-link">← Dashboard</Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">My jobs</h1>
          <p className="muted">New requests are matched to your services, districts and availability.</p>
        </div>
        {data && (
          <div className="earnings">
            <span className="small muted">Completed work</span>
            <strong>{formatRs(data.earnings)}</strong>
          </div>
        )}
      </div>

      {data && data.providerStatus !== 'approved' && (
        <p className="alert alert--error">Your account isn’t approved yet, so you won’t receive job requests. Check your dashboard for what’s needed.</p>
      )}
      {notice && <p className="success-banner success-banner--slim" role="status">{notice}</p>}
      {error && <p className="alert alert--error">{error}</p>}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`tab${tab === t.value ? ' tab--on' : ''}`}
            onClick={() => setParams({ tab: t.value }, { replace: true })}
          >
            {t.label}
            {data && <span className="tab__count">{data[t.value].length}</span>}
          </button>
        ))}
      </div>

      {!data && !error && <p className="muted">Loading jobs…</p>}
      {data && list.length === 0 && (
        <div className="empty">
          <BriefcaseBusiness size={28} aria-hidden="true" />
          <p>
            {tab === 'requests'
              ? 'No new requests right now. Keep your availability up to date to get more jobs.'
              : tab === 'upcoming'
                ? 'No upcoming jobs.'
                : 'Completed jobs will appear here.'}
          </p>
          {tab === 'requests' && (
            <Link to="/provider/profile" className="btn btn--ghost btn--small">Update availability</Link>
          )}
        </div>
      )}
      <div className="job-list">
        {list.map((job) => (
          <JobCard key={job._id} job={job} labels={labels} busy={busy === job._id} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}
