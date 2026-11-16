import { Briefcase, CalendarDays, MapPin, ShieldCheck, Star } from 'lucide-react'
import { DAY_LABELS, PERIOD_LABELS } from '../../lib/availability'
import { experienceLabel } from '../../lib/provider'
import { SERVICE_ICONS } from '../../lib/serviceIcons'
import Avatar from './Avatar'

const memberSince = (date) =>
  new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

// What customers see; also used as the provider's own preview
export default function PublicProfileCard({ profile, photoUrl, serviceLabels, preview = false }) {
  return (
    <article className="public-profile">
      <header className="public-profile__head">
        <Avatar src={photoUrl} name={profile.name} size={96} />
        <div>
          <h1 className="public-profile__name">
            {profile.name}
            {profile.verified ? (
              <span className="verified">
                <ShieldCheck size={16} aria-hidden="true" /> Verified by LankaLink
              </span>
            ) : (
              preview && <span className="tag tag--quiet">Not verified yet</span>
            )}
          </h1>
          <p className="public-profile__facts">
            <span>
              <Star size={15} aria-hidden="true" />
              {profile.reviewCount ? `${profile.rating.toFixed(1)} (${profile.reviewCount} reviews)` : 'New provider, no reviews yet'}
            </span>
            <span>
              <Briefcase size={15} aria-hidden="true" />
              {experienceLabel(profile.experienceYears)} of experience
            </span>
            {profile.memberSince && (
              <span>
                <CalendarDays size={15} aria-hidden="true" />
                On LankaLink since {memberSince(profile.memberSince)}
              </span>
            )}
          </p>
        </div>
      </header>

      {profile.bio && (
        <section className="public-profile__section">
          <h2>About</h2>
          <p className="public-profile__bio">{profile.bio}</p>
        </section>
      )}

      <section className="public-profile__section">
        <h2>Services</h2>
        <div className="service-list">
          {profile.services.map((s) => {
            const Icon = SERVICE_ICONS[s]
            return (
              <span key={s} className="service-chip">
                {Icon && <Icon size={15} aria-hidden="true" />}
                {serviceLabels[s] ?? s}
              </span>
            )
          })}
        </div>
      </section>

      <section className="public-profile__section">
        <h2>Works in</h2>
        <p className="area-line">
          <MapPin size={15} aria-hidden="true" /> {profile.serviceAreas.join(', ')}
        </p>
      </section>

      <section className="public-profile__section">
        <h2>Usually available</h2>
        {profile.availability?.length ? (
          <ul className="avail-list">
            {profile.availability.map((a) => (
              <li key={a.day}>
                <strong>{DAY_LABELS[a.day]}</strong>
                <span>{a.periods.map((p) => PERIOD_LABELS[p]).join(', ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Ask when booking.</p>
        )}
      </section>
    </article>
  )
}
