import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { StarInput } from '../components/reviews/Stars'

// Customers land here from a confirmed booking: /reviews/new?booking=<booking id>
export default function WriteReview() {
  const [params] = useSearchParams()
  const { token } = useAuth()
  const bookingId = params.get('booking') ?? ''
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const [state, setState] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!rating) {
      setErrors({ rating: 'Choose 1 to 5 stars' })
      return
    }
    setState({ busy: true })
    try {
      await api('/reviews', { method: 'POST', token, body: { bookingId, rating, comment: comment.trim() || undefined } })
      setState({ done: true })
    } catch (err) {
      setErrors(err.details || {})
      setState({ error: err.message })
    }
  }

  if (state?.done) {
    return (
      <div className="verify">
        <CircleCheck size={48} className="verify__icon verify__icon--ok" aria-hidden="true" />
        <h1>Thank you for your review</h1>
        <p className="muted">It helps other families choose with confidence, and helps good providers get more work.</p>
        <Link to="/" className="btn btn--primary">Back to LankaLink</Link>
      </div>
    )
  }

  return (
    <div className="auth write-review">
      <h1>How was the visit?</h1>
      <p className="muted">Your review is shown on the provider’s profile with your first name.</p>
      <form onSubmit={submit} noValidate>
        <StarInput value={rating} onChange={(n) => { setRating(n); setErrors({}) }} error={errors.rating} />
        <label className="field">
          <span className="field__label">
            Tell others about it <span className="field__optional">(optional)</span>
          </span>
          <textarea
            rows="4"
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Was the work done well? Were they on time and careful?"
          />
          {errors.comment && <span className="field__error">{errors.comment}</span>}
        </label>
        {state?.error && <p className="alert alert--error" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={state?.busy}>
          {state?.busy ? 'Sending…' : 'Post review'}
        </button>
      </form>
    </div>
  )
}
