import { CalendarPlus, ChevronRight, MapPin, Repeat } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import BookingChip from '../components/bookings/BookingChip'
import { FREQUENCY_LABELS, formatDay } from '../lib/bookings'
import { PERIOD_LABELS } from '../lib/availability'
import { formatRs } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'
import { useServiceLabels } from '../lib/useServiceLabels'

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'plans', label: 'Repeat plans' },
]

function BookingRow({ booking, labels }) {
  const Icon = SERVICE_ICONS[booking.service]
  return (
    <Link to={`/bookings/${booking._id}`} className="booking-row">
      <span className="booking-row__icon" aria-hidden="true">
        {Icon && <Icon size={20} />}
      </span>
      <span className="booking-row__main">
        <span className="booking-row__title">{labels[booking.service] ?? booking.service}</span>
        <span className="booking-row__meta">
          {formatDay(booking.date)} · {PERIOD_LABELS[booking.period]}
          {booking.recurringPlan && (
            <>
              {' · '}
              <Repeat size={13} aria-label="Repeats" />
            </>
          )}
        </span>
        <span className="booking-row__meta">
          <MapPin size={13} aria-hidden="true" /> {booking.location.label || booking.location.district}
          {booking.provider && ` · ${booking.provider.name}`}
        </span>
      </span>
      <span className="booking-row__side">
        <BookingChip status={booking.status} />
        <span className="small muted">{formatRs(booking.price)}</span>
      </span>
      <ChevronRight size={18} className="booking-row__chevron" aria-hidden="true" />
    </Link>
  )
}

function Plans({ token, labels }) {
  const [plans, setPlans] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(
    () =>
      api('/bookings/recurring', { token })
        .then((r) => setPlans(r.plans))
        .catch((err) => setError(err.message)),
    [token],
  )
  useEffect(() => {
    load()
  }, [load])

  async function act(plan, action) {
    if (action === 'cancel' && !window.confirm('Cancel this repeat plan? Upcoming visits from it will be cancelled too.')) return
    if (action === 'pause' && !window.confirm('Pause this plan? Upcoming visits from it will be cancelled until you resume.')) return
    setBusy(plan._id)
    setError(null)
    try {
      await api(`/bookings/recurring/${plan._id}/${action}`, { method: 'POST', token })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (error) return <p className="alert alert--error">{error}</p>
  if (!plans) return <p className="muted">Loading…</p>
  if (!plans.length) {
    return (
      <div className="empty">
        <Repeat size={28} aria-hidden="true" />
        <p>No repeat plans yet. Choose “Repeat this visit” when you book.</p>
      </div>
    )
  }
  return (
    <ul className="plan-list">
      {plans.map((p) => (
        <li key={p._id} className="panel plan-item">
          <div>
            <p className="booking-row__title">{labels[p.service] ?? p.service}</p>
            <p className="booking-row__meta">
              {FREQUENCY_LABELS[p.frequency]}, {PERIOD_LABELS[p.period].toLowerCase()} · {p.location.label || p.location.district}
            </p>
            <p className="small muted">
              {p.status === 'paused'
                ? 'Paused'
                : p.nextVisit
                  ? <>Next visit: <Link to={`/bookings/${p.nextVisit._id}`}>{formatDay(p.nextVisit.date)}</Link></>
                  : `Next visit will be scheduled for ${formatDay(p.nextDate)}`}
            </p>
          </div>
          <div className="plan-item__actions">
            {p.status === 'active' ? (
              <button type="button" className="btn btn--ghost btn--small" disabled={busy === p._id} onClick={() => act(p, 'pause')}>
                Pause
              </button>
            ) : (
              <button type="button" className="btn btn--primary btn--small" disabled={busy === p._id} onClick={() => act(p, 'resume')}>
                Resume
              </button>
            )}
            <button type="button" className="btn btn--danger-ghost btn--small" disabled={busy === p._id} onClick={() => act(p, 'cancel')}>
              Cancel plan
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// Customer's bookings: /bookings
export default function MyBookings() {
  const { token, user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'upcoming'
  const labels = useServiceLabels()
  // Results are kept with the tab they belong to, so switching tabs shows Loading without resetting state
  const [result, setResult] = useState({ tab: null, data: null })
  const data = result.tab === tab ? result.data : null
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tab === 'plans') return
    api(`/bookings?scope=${tab}`, { token })
      .then((d) => setResult({ tab, data: d }))
      .catch((err) => setError(err.message))
  }, [token, tab])

  return (
    <div className="narrow-page my-bookings">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hi {user.name.split(' ')[0]}, your bookings</h1>
          <p className="muted">Track every visit from booking to completion.</p>
        </div>
        <Link to="/book" className="btn btn--ink">
          <CalendarPlus size={18} aria-hidden="true" /> Book a visit
        </Link>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`tab${tab === t.value ? ' tab--on' : ''}`}
            onClick={() => setParams(t.value === 'upcoming' ? {} : { tab: t.value }, { replace: true })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' ? (
        <Plans token={token} labels={labels} />
      ) : (
        <>
          {error && <p className="alert alert--error">{error}</p>}
          {!data && !error && <p className="muted">Loading…</p>}
          {data?.awaitingConfirmation?.length > 0 && (
            <section className="awaiting">
              <h2 className="panel__title">Please confirm these visits</h2>
              <div className="booking-list">
                {data.awaitingConfirmation.map((b) => (
                  <BookingRow key={b._id} booking={b} labels={labels} />
                ))}
              </div>
            </section>
          )}
          {data && data.bookings.length === 0 && !data.awaitingConfirmation?.length && (
            <div className="empty">
              <CalendarPlus size={28} aria-hidden="true" />
              <p>{tab === 'upcoming' ? 'No upcoming visits.' : 'No past bookings yet.'}</p>
              {tab === 'upcoming' && (
                <Link to="/book" className="btn btn--primary btn--small">
                  Book your first visit
                </Link>
              )}
            </div>
          )}
          {data?.bookings.length > 0 && (
            <div className="booking-list">
              {data.bookings.map((b) => (
                <BookingRow key={b._id} booking={b} labels={labels} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
