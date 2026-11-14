import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import ReasonDialog from '../../components/admin/ReasonDialog'
import { Stars } from '../../components/reviews/Stars'

const TABS = [
  { value: '', label: 'All reviews' },
  { value: 'low', label: '1–2 stars' },
  { value: 'hidden', label: 'Hidden' },
]

const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminReviews() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const show = params.get('show') || ''
  const provider = params.get('provider') || ''
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [hiding, setHiding] = useState(null)

  const load = useCallback(() => {
    const q = new URLSearchParams()
    if (show) q.set('show', show)
    if (provider) q.set('provider', provider)
    return api(`/admin/reviews?${q}`, { token })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [token, show, provider])

  useEffect(() => {
    load()
  }, [load])

  const setHidden = (id, body) => api(`/admin/reviews/${id}`, { method: 'PATCH', token, body })

  return (
    <div className="admin">
      <header className="admin__head">
        <h1>Reviews</h1>
        <p className="muted">Hide reviews that break the rules, for example abusive language or personal details. Hidden reviews don’t count towards a rating.</p>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={show === t.value}
            className={`tab${show === t.value ? ' tab--on' : ''}`}
            onClick={() => {
              const next = new URLSearchParams(params)
              if (t.value) next.set('show', t.value)
              else next.delete('show')
              setParams(next, { replace: true })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {provider && (
        <p className="filter-note">
          Showing one provider’s reviews.{' '}
          <button type="button" className="link-btn" onClick={() => setParams(show ? { show } : {}, { replace: true })}>
            Show all providers
          </button>
        </p>
      )}

      {error && <p className="alert alert--error">{error}</p>}
      {!data && !error && <p className="muted">Loading reviews…</p>}
      {data && data.reviews.length === 0 && (
        <div className="empty">
          <p>
            <strong>No reviews here.</strong>
          </p>
          <p className="muted">Reviews appear after customers rate confirmed bookings.</p>
        </div>
      )}

      {data && data.reviews.length > 0 && (
        <ul className="admin-reviews">
          {data.reviews.map((r) => (
            <li key={r._id} className={`admin-review${r.hidden ? ' admin-review--hidden' : ''}`}>
              <div className="admin-review__top">
                <Stars value={r.rating} />
                <span className="muted small">{date(r.createdAt)}</span>
              </div>
              {r.comment ? <p className="admin-review__text">{r.comment}</p> : <p className="muted small">No comment</p>}
              <p className="muted small">
                By {r.customer.name} ({r.customer.email}) for{' '}
                <Link to={`/admin/providers/${r.provider._id}`}>{r.provider.name}</Link>
              </p>
              {r.reply?.text && <p className="admin-review__reply">Provider replied: “{r.reply.text}”</p>}
              {r.hidden && (
                <p className="admin-review__hidden">
                  Hidden by {r.hiddenBy ?? 'an admin'}: {r.hiddenReason}
                </p>
              )}
              <div>
                {r.hidden ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={async () => {
                      await setHidden(r._id, { hidden: false })
                      load()
                    }}
                  >
                    <Eye size={15} aria-hidden="true" /> Show again
                  </button>
                ) : (
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => setHiding(r)}>
                    <EyeOff size={15} aria-hidden="true" /> Hide review
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReasonDialog
        open={Boolean(hiding)}
        title="Hide this review"
        description="It will no longer be shown on the provider’s profile or count towards their rating."
        suggestions={['Abusive or offensive language', 'Contains personal details', 'Not about the service', 'Spam']}
        confirmLabel="Hide review"
        danger
        onClose={() => setHiding(null)}
        onConfirm={async (reason) => {
          await setHidden(hiding._id, { hidden: true, reason })
          setHiding(null)
          load()
        }}
      />
    </div>
  )
}
