import { CalendarX2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import BookingChip from '../../components/bookings/BookingChip'
import { ADMIN_STATUS, formatDay, formatWhen } from '../../lib/bookings'
import { PERIOD_LABELS } from '../../lib/availability'
import { formatRs } from '../../lib/marketing'
import { useServiceLabels } from '../../lib/useServiceLabels'

const TABS = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Unassigned' },
  { value: 'assigned', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function AssignDialog({ booking, token, onClose, onDone }) {
  const ref = useRef(null)
  const [candidates, setCandidates] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ref.current.showModal()
    api(`/admin/bookings/${booking._id}/candidates`, { token })
      .then((r) => setCandidates(r.candidates))
      .catch((err) => setError(err.message))
  }, [booking._id, token])

  async function assign(providerId) {
    setBusy(true)
    setError(null)
    try {
      await api(`/admin/bookings/${booking._id}/assign`, { method: 'POST', token, body: { providerId } })
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="assign-title">
      <h2 id="assign-title" className="dialog__title">Assign a provider</h2>
      <p className="muted small">
        Approved providers who offer this service in {booking.location.district} and are free on {formatDay(booking.date)} ({PERIOD_LABELS[booking.period].toLowerCase()}).
      </p>
      {error && <p className="field__error" role="alert">{error}</p>}
      {!candidates && !error && <p className="muted">Loading…</p>}
      {candidates?.length === 0 && <p className="muted">Nobody is free at this time. Ask the customer to reschedule.</p>}
      <ul className="candidate-list">
        {candidates?.map((c) => (
          <li key={c._id}>
            <span>
              <strong>{c.name}</strong>
              <span className="small muted">
                {' '}· {c.rating?.count ? `${c.rating.average.toFixed(1)} ★ (${c.rating.count})` : 'No reviews'}
                {c.declined && ' · declined before'}
              </span>
            </span>
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={busy || booking.provider?._id === c._id}
              onClick={() => assign(c._id)}
            >
              {booking.provider?._id === c._id ? 'Offered' : 'Assign'}
            </button>
          </li>
        ))}
      </ul>
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>Close</button>
      </div>
    </dialog>
  )
}

export default function AdminBookings() {
  const { token } = useAuth()
  const labels = useServiceLabels()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const page = Number(params.get('page')) || 1
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [assigning, setAssigning] = useState(null)

  const load = useCallback(() => {
    const q = new URLSearchParams({ page })
    if (status) q.set('status', status)
    return api(`/admin/bookings?${q}`, { token })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [token, status, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin">
      <header className="admin__head">
        <h1>Bookings</h1>
        <p className="muted">
          Bookings are matched automatically. Step in when nobody accepts, for example by assigning a provider by hand.
        </p>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            className={`tab${status === t.value ? ' tab--on' : ''}`}
            onClick={() => setParams(t.value ? { status: t.value } : {}, { replace: true })}
          >
            {t.label}
            {t.value && data?.counts[t.value] > 0 && <span className="tab__count">{data.counts[t.value]}</span>}
          </button>
        ))}
      </div>

      {error && <p className="alert alert--error">{error}</p>}
      {!data && !error && <p className="muted">Loading bookings…</p>}
      {data && data.bookings.length === 0 && (
        <div className="empty">
          <CalendarX2 size={28} aria-hidden="true" />
          <p>No bookings here.</p>
        </div>
      )}

      {data?.bookings.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visit</th>
                <th>Service</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Provider</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    {formatDay(b.date)}
                    <br />
                    <span className="small muted">{PERIOD_LABELS[b.period]}</span>
                  </td>
                  <td>
                    {labels[b.service] ?? b.service}
                    <br />
                    <span className="small muted">{formatRs(b.price)}{b.recurringPlan && ' · repeats'}</span>
                  </td>
                  <td>
                    {b.customer?.name}
                    <br />
                    <span className="small muted">{b.customer?.phone}</span>
                  </td>
                  <td>{b.location.district}</td>
                  <td>
                    {b.provider?.name ?? <span className="muted">—</span>}
                    {b.declinedBy?.length > 0 && (
                      <>
                        <br />
                        <span className="small muted">{b.declinedBy.length} declined</span>
                      </>
                    )}
                  </td>
                  <td>
                    <BookingChip status={b.status} labels={ADMIN_STATUS} />
                    <br />
                    <span className="small muted">{formatWhen(b.updatedAt)}</span>
                  </td>
                  <td>
                    {['requested', 'assigned'].includes(b.status) && (
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setAssigning(b)}>
                        <UserPlus size={14} aria-hidden="true" /> Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="pager">
          <button type="button" className="btn btn--ghost btn--small" disabled={page <= 1} onClick={() => setParams({ ...(status && { status }), page: page - 1 })}>
            Previous
          </button>
          <span className="small muted">Page {page} of {data.pages}</span>
          <button type="button" className="btn btn--ghost btn--small" disabled={page >= data.pages} onClick={() => setParams({ ...(status && { status }), page: page + 1 })}>
            Next
          </button>
        </div>
      )}

      {assigning && (
        <AssignDialog
          booking={assigning}
          token={token}
          onClose={() => setAssigning(null)}
          onDone={() => {
            setAssigning(null)
            load()
          }}
        />
      )}
    </div>
  )
}
