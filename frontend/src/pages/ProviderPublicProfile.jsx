import { ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../api/client'
import PublicProfileCard from '../components/provider/PublicProfileCard'
import ReviewItem from '../components/reviews/ReviewItem'
import { RatingSummary } from '../components/reviews/Stars'
import { formatRs } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'

// Public page customers open from search results
export default function ProviderPublicProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  useEffect(() => {
    api(`/providers/${id}/public`)
      .then((d) => setProfile(d.profile))
      .catch((err) => setError(err.status === 404 ? 'This provider is not available.' : err.message))
    api('/providers/options')
      .then((o) => setServices(o.services))
      .catch(() => {})
  }, [id])

  const loadReviews = useCallback(
    (p) =>
      api(`/providers/${id}/reviews?page=${p}`)
        .then((d) => {
          setReviews((prev) => (p === 1 || !prev ? d : { ...d, reviews: [...prev.reviews, ...d.reviews] }))
          setPage(p)
        })
        .catch(() => {}),
    [id],
  )

  useEffect(() => {
    loadReviews(1)
  }, [loadReviews])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!profile) return <p className="muted">Loading…</p>

  const labels = Object.fromEntries(services.map((s) => [s.value, s.label]))
  const offered = services.filter((s) => profile.services.includes(s.value))
  const photoUrl = profile.hasPhoto ? `/api/providers/${profile._id}/photo?v=${profile.photoVersion}` : null

  return (
    <div className="pro-page">
      <div className="pro-page__main">
        <PublicProfileCard profile={profile} photoUrl={photoUrl} serviceLabels={labels} />

        <section className="panel pro-page__reviews" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="panel__title">
            Reviews
          </h2>
          {reviews && (
            <>
              <RatingSummary average={profile.rating} count={profile.reviewCount} distribution={reviews.distribution} />
              {reviews.reviews.length > 0 ? (
                <ul className="review-list">
                  {reviews.reviews.map((r) => (
                    <ReviewItem key={r._id} review={r} providerName={profile.name} />
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  {profile.name} is new on LankaLink. Reviews appear here after customers’ confirmed visits.
                </p>
              )}
              {page < reviews.pages && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => loadReviews(page + 1)}>
                  Show more reviews
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <aside className="pro-page__side">
        <div className="panel">
          <h2 className="panel__title">Services and prices</h2>
          <ul className="price-list">
            {offered.map((s) => {
              const Icon = SERVICE_ICONS[s.value]
              return (
                <li key={s.value}>
                  <span className="price-list__icon" aria-hidden="true">
                    {Icon && <Icon size={18} />}
                  </span>
                  <span className="price-list__name">{s.label}</span>
                  <span className="price-list__price">From {formatRs(s.priceFrom)}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted small">Booking through LankaLink opens soon in {profile.serviceAreas.join(', ')}.</p>
        </div>
        <div className="safety-note">
          <ShieldCheck size={20} aria-hidden="true" />
          <p>
            <strong>Checked by LankaLink.</strong> We verified {profile.name.split(' ')[0]}’s NIC and police clearance
            report before approving them.
          </p>
        </div>
      </aside>
    </div>
  )
}
