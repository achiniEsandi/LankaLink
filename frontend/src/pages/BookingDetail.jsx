import { Check, CircleCheck, MapPin, Phone, Repeat, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Avatar from '../components/provider/Avatar'
import { Stars } from '../components/reviews/Stars'
import BookingChip from '../components/bookings/BookingChip'
import { PERIOD_HOURS, TIMELINE, formatDay, formatWhen } from '../lib/bookings'
import { PERIOD_LABELS } from '../lib/availability'
import { formatRs } from '../lib/marketing'
import { useServiceLabels } from '../lib/useServiceLabels'

const CANCELLABLE = ['requested', 'assigned', 'accepted']
const CANCEL_REASONS = ['Plans changed', 'Booked by mistake', 'Found someone else', 'No longer needed']

function Modal({ open, title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-label={title}>
      <h2 className="dialog__title">{title}</h2>
      {children}
    </dialog>
  )
}

// Each lifecycle step, ticked when it has happened (using the latest time it happened)
function Timeline({ booking }) {
  if (booking.status === 'cancelled') {
    const at = booking.history.findLast((h) => h.status === 'cancelled')?.at
    return (
      <ol className="timeline">
        <li className="timeline__step timeline__step--done">
          <span className="timeline__dot"><Check size={14} aria-hidden="true" /></span>
          <div><p className="timeline__title">Booking placed</p></div>
        </li>
        <li className="timeline__step timeline__step--cancelled">
          <span className="timeline__dot"><X size={14} aria-hidden="true" /></span>
          <div>
            <p className="timeline__title">Cancelled</p>
            <p className="small muted">{at && formatWhen(at)}{booking.cancelledReason && ` · ${booking.cancelledReason}`}</p>
          </div>
        </li>
      </ol>
    )
  }
  const reached = TIMELINE.findIndex((s) => s.status === booking.status)
  return (
    <ol className="timeline">
      {TIMELINE.map((step, i) => {
        // "Placed" is when it was first booked; later steps show their most recent time
        const entry = step.status === 'requested'
          ? booking.history.find((h) => h.status === step.status)
          : booking.history.findLast((h) => h.status === step.status)
        // Reschedules are logged as a new "requested" entry; mention the latest one under "placed"
        const rescheduled = step.status === 'requested' && booking.history.findLast((h) => h.note?.startsWith('Rescheduled'))
        const state = i < reached || (i === reached && booking.status === 'confirmed') ? 'done' : i === reached ? 'current' : 'todo'
        return (
          <li key={step.status} className={`timeline__step timeline__step--${state}`}>
            <span className="timeline__dot">{state === 'done' && <Check size={14} aria-hidden="true" />}</span>
            <div>
              <p className="timeline__title">{step.title}</p>
              {entry && i <= reached && (
                <p className="small muted">
                  {formatWhen(entry.at)}
                  {entry.note && ` · ${entry.note}`}
                  {rescheduled && ` · ${rescheduled.note}`}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const { token } = useAuth()
  const location = useLocation()
  const labels = useServiceLabels()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [reason, setReason] = useState('')
  const [slot, setSlot] = useState({ date: '', period: '' })
  const [limits, setLimits] = useState(null)

  const load = useCallback(
    () =>
      api(`/bookings/${id}`, { token })
        .then((r) => setBooking(r.booking))
        .catch((err) => setError(err.message)),
    [id, token],
  )
  useEffect(() => {
    load()
  }, [load])

  async function act(path, body) {
    setBusy(true)
    setActionError(null)
    try {
      const r = await api(`/bookings/${id}/${path}`, { method: 'POST', token, body })
      setBooking(r.booking)
      setDialog(null)
    } catch (err) {
      setActionError(err.details ? Object.values(err.details).join(' ') : err.message)
    } finally {
      setBusy(false)
    }
  }

  function openReschedule() {
    setSlot({ date: booking.date, period: booking.period })
    setActionError(null)
    setDialog('reschedule')
    if (!limits) api('/bookings/options').then(setLimits).catch(() => {})
  }

  if (error) return <p className="alert alert--error">{error}</p>
  if (!booking) return <p className="muted">Loading…</p>

  const p = booking.provider
  const canChange = CANCELLABLE.includes(booking.status)

  return (
    <div className="narrow-page booking-detail">
      <Link to="/bookings" className="back-link">← My bookings</Link>

      {location.state?.justBooked && (
        <p className="success-banner">
          <CircleCheck size={20} aria-hidden="true" /> Booking placed.{' '}
          {booking.status === 'assigned'
            ? 'We’ve matched you with a professional and are waiting for them to accept.'
            : 'We’re finding a professional and will keep trying until someone is free.'}
        </p>
      )}

      <header className="booking-detail__head">
        <div>
          <h1 className="page-title">{labels[booking.service] ?? 'Booking'}</h1>
          <p className="lead">
            {formatDay(booking.date, { long: true })} · {PERIOD_LABELS[booking.period]} ({PERIOD_HOURS[booking.period]})
          </p>
        </div>
        <BookingChip status={booking.status} />
      </header>

      {booking.status === 'completed' && (
        <div className="panel panel--accent">
          <p><strong>{p?.name ?? 'Your professional'}</strong> has marked this visit as done. Is everything as expected?</p>
          {actionError && !dialog && <p className="alert alert--error">{actionError}</p>}
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => act('confirm')}>
            Yes, confirm the job is done
          </button>
        </div>
      )}
      {booking.status === 'confirmed' && !booking.reviewed && (
        <div className="panel panel--accent">
          <p>Thanks for confirming. How did {p?.name?.split(' ')[0] ?? 'they'} do?</p>
          <Link to={`/reviews/new?booking=${booking._id}`} className="btn btn--primary">
            <Star size={16} aria-hidden="true" /> Leave a review
          </Link>
        </div>
      )}

      <div className="booking-detail__grid">
        <section className="panel">
          <h2 className="panel__title">Progress</h2>
          <Timeline booking={booking} />
        </section>

        <div className="booking-detail__side">
          <section className="panel">
            <h2 className="panel__title">Your professional</h2>
            {p ? (
              <div className="pro-mini">
                <Avatar name={p.name} src={p.hasPhoto ? `/api/providers/${p._id}/photo` : undefined} size={48} />
                <div>
                  <Link to={`/providers/${p._id}`} className="pro-mini__name">{p.name}</Link>
                  {p.rating?.count > 0 ? (
                    <p className="small"><Stars value={p.rating.average} /> {p.rating.average.toFixed(1)} ({p.rating.count})</p>
                  ) : (
                    <p className="small muted">New on LankaLink</p>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="small pro-mini__phone">
                      <Phone size={13} aria-hidden="true" /> {p.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted small">
                {booking.status === 'cancelled' ? 'No professional assigned.' : 'We’re looking for someone who is free at this time.'}
              </p>
            )}
            {booking.status === 'assigned' && <p className="small muted">They have 24 hours to accept; otherwise we offer it to the next best match.</p>}
          </section>

          <section className="panel">
            <h2 className="panel__title">Details</h2>
            <dl className="summary-list">
              <div>
                <dt><MapPin size={14} aria-hidden="true" /> Where</dt>
                <dd>
                  {booking.location.label && <strong>{booking.location.label}<br /></strong>}
                  {booking.location.address}, {booking.location.district}
                </dd>
              </div>
              {booking.location.contactName && (
                <div>
                  <dt>Meet</dt>
                  <dd>{booking.location.contactName}{booking.location.contactPhone && ` · ${booking.location.contactPhone}`}</dd>
                </div>
              )}
              {booking.instructions && (
                <div>
                  <dt>Notes</dt>
                  <dd>{booking.instructions}</dd>
                </div>
              )}
              {booking.recurringPlan && (
                <div>
                  <dt><Repeat size={14} aria-hidden="true" /> Repeats</dt>
                  <dd><Link to="/bookings?tab=plans">Part of a repeat plan</Link></dd>
                </div>
              )}
              <div className="summary-list__total">
                <dt>Price</dt>
                <dd>{formatRs(booking.price)}</dd>
              </div>
            </dl>
          </section>

          {canChange && (
            <div className="booking-detail__actions">
              <button type="button" className="btn btn--ghost btn--block" onClick={openReschedule}>
                Reschedule
              </button>
              <button
                type="button"
                className="btn btn--danger-ghost btn--block"
                onClick={() => {
                  setReason('')
                  setActionError(null)
                  setDialog('cancel')
                }}
              >
                Cancel booking
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={dialog === 'cancel'} title="Cancel this booking?" onClose={() => setDialog(null)}>
        <p className="muted small">You won’t be charged. Tell us why, if you like.</p>
        <div className="suggestions">
          {CANCEL_REASONS.map((r) => (
            <button key={r} type="button" className={`suggestion${reason === r ? ' suggestion--on' : ''}`} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>
        <label className="field">
          <span className="field__label">Reason <span className="field__optional">(optional)</span></span>
          <textarea rows="2" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {actionError && <p className="field__error" role="alert">{actionError}</p>}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setDialog(null)} disabled={busy}>Keep booking</button>
          <button type="button" className="btn btn--danger btn--small" disabled={busy} onClick={() => act('cancel', { reason: reason.trim() || undefined })}>
            {busy ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      </Modal>

      <Modal open={dialog === 'reschedule'} title="Choose a new time" onClose={() => setDialog(null)}>
        <p className="muted small">We’ll ask the same professional first. If they’re not free, we’ll find someone else.</p>
        <label className="field">
          <span className="field__label">Date</span>
          <input
            type="date"
            min={limits?.minDate}
            max={limits?.maxDate}
            value={slot.date}
            onChange={(e) => setSlot((s) => ({ ...s, date: e.target.value }))}
          />
        </label>
        <div className="pills" role="radiogroup" aria-label="Time of day">
          {Object.keys(PERIOD_LABELS).map((value) => (
            <label key={value} className={`pill${slot.period === value ? ' pill--on' : ''}`}>
              <input type="radio" name="new-period" checked={slot.period === value} onChange={() => setSlot((s) => ({ ...s, period: value }))} />
              {PERIOD_LABELS[value]}
            </label>
          ))}
        </div>
        {actionError && <p className="field__error" role="alert">{actionError}</p>}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setDialog(null)} disabled={busy}>Back</button>
          <button type="button" className="btn btn--primary btn--small" disabled={busy} onClick={() => act('reschedule', slot)}>
            {busy ? 'Saving…' : 'Reschedule'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
