import { ArrowLeft, MessageSquareReply } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import ReviewItem from '../components/reviews/ReviewItem'
import { RatingSummary } from '../components/reviews/Stars'

function ReplyBox({ review, token, onSaved }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(review.reply?.text ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (review.hidden) return <p className="muted small">LankaLink has hidden this review, so it isn’t shown to customers.</p>
  if (!open) {
    return (
      <button type="button" className="link-btn review__reply-btn" onClick={() => setOpen(true)}>
        <MessageSquareReply size={15} aria-hidden="true" /> {review.reply?.text ? 'Edit your reply' : 'Reply'}
      </button>
    )
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/providers/me/reviews/${review._id}/reply`, { method: 'POST', token, body: { text } })
      setOpen(false)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="reply-form" onSubmit={save}>
      <label className="field">
        <span className="field__label">Your reply (customers can see this)</span>
        <textarea rows="3" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      </label>
      {error && <p className="field__error">{error}</p>}
      <div className="reply-form__actions">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--small" disabled={busy || !text.trim()}>
          {busy ? 'Saving…' : 'Post reply'}
        </button>
      </div>
    </form>
  )
}

export default function ProviderReviews() {
  const { token, user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(
    () =>
      api('/providers/me/reviews', { token })
        .then(setData)
        .catch((err) => setError(err.message)),
    [token],
  )

  useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading your reviews…</p>

  return (
    <div className="narrow-page">
      <Link to="/provider/dashboard" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to my account
      </Link>
      <h1 className="page-title">Your reviews</h1>
      <p className="muted">Customers rate you after each confirmed job. A thoughtful reply helps future customers choose you.</p>

      <section className="panel">
        <RatingSummary average={data.rating?.average} count={data.rating?.count} distribution={data.distribution} />
      </section>

      {data.reviews.length === 0 ? (
        <div className="empty">
          <p>
            <strong>No reviews yet</strong>
          </p>
          <p className="muted">Reviews appear here after customers confirm your completed jobs.</p>
        </div>
      ) : (
        <ul className="review-list review-list--cards">
          {data.reviews.map((r) => (
            <ReviewItem key={r._id} review={r} providerName={user?.name?.split(' ')[0]}>
              <ReplyBox review={r} token={token} onSaved={load} />
            </ReviewItem>
          ))}
        </ul>
      )}
    </div>
  )
}
