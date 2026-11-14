import { CalendarDays, House, MapPin, Pencil, Trash2, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { JobsSpot } from '../components/illustrations/Spots'
import { labelOf, mapsLink, useOptions } from '../lib/customer'

function sriLankaTime() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit', hour12: true }).format(
    new Date(),
  )
}

function PropertyCard({ property, typeLabel, onDelete }) {
  const map = mapsLink(property.location)
  return (
    <li className="item">
      <span className="item__icon" aria-hidden="true">
        <House size={18} />
      </span>
      <div className="item__body">
        <p className="item__title">{property.label}</p>
        <p className="item__meta">
          {typeLabel} · {property.district}
        </p>
        <p className="item__text">{property.address}</p>
        {map ? (
          <a href={map} target="_blank" rel="noreferrer" className="item__link">
            <MapPin size={14} aria-hidden="true" /> View on map
          </a>
        ) : (
          <p className="item__warn">Add the GPS location so providers can check in at the right place.</p>
        )}
      </div>
      <div className="item__actions">
        <Link to={`/customer/properties/${property._id}`} className="icon-btn" aria-label={`Edit ${property.label}`}>
          <Pencil size={16} />
        </Link>
        <button type="button" className="icon-btn" onClick={onDelete} aria-label={`Remove ${property.label}`}>
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}

function FamilyCard({ member, relationshipLabel, onDelete }) {
  return (
    <li className="item">
      <span className="item__icon" aria-hidden="true">
        <UserRound size={18} />
      </span>
      <div className="item__body">
        <p className="item__title">{member.name}</p>
        <p className="item__meta">
          {relationshipLabel}
          {member.age != null && ` · ${member.age} years`} · {member.district}
        </p>
        {member.careNotes && <p className="item__text">{member.careNotes}</p>}
        {member.emergencyContact?.name && (
          <p className="item__text">
            Emergency contact: {member.emergencyContact.name}
            {member.emergencyContact.phone && `, ${member.emergencyContact.phone}`}
          </p>
        )}
      </div>
      <div className="item__actions">
        <Link to={`/customer/family/${member._id}`} className="icon-btn" aria-label={`Edit ${member.name}`}>
          <Pencil size={16} />
        </Link>
        <button type="button" className="icon-btn" onClick={onDelete} aria-label={`Remove ${member.name}`}>
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, signOut } = useAuth()
  const { data: options } = useOptions('/customers/options')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api('/customers/me/dashboard', { token })
      .then(setData)
      .catch((err) => {
        if (err.status === 401) {
          signOut()
          navigate('/login', { replace: true })
        } else {
          setError(err.message)
        }
      })
  }, [token, signOut, navigate])

  useEffect(load, [load])

  async function remove(kind, id, name) {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return
    try {
      await api(`/customers/me/${kind}/${id}`, { method: 'DELETE', token })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading your account…</p>

  const { user, properties, familyMembers } = data
  const firstName = user.name.split(' ')[0]
  const isNew = !properties.length && !familyMembers.length

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div>
          <h1>{location.state?.justRegistered ? `Welcome to LankaLink, ${firstName}` : `Hello, ${firstName}`}</h1>
          <p className="muted">It is {sriLankaTime()} in Sri Lanka right now.</p>
        </div>
        <div className="dashboard__art">
          <JobsSpot />
        </div>
      </header>

      {isNew && (
        <div className="note">
          <strong>Get started in two steps</strong>
          <ol className="next-list">
            <li>Add a home you want looked after, or a family member who would like visits.</li>
            <li>Browse services and book your first visit.</li>
          </ol>
        </div>
      )}

      <div className="dashboard__grid">
        <div className="stack">
          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Your properties</h2>
              <Link to="/customer/properties/new" className="btn btn--ghost btn--small">
                Add property
              </Link>
            </div>
            {properties.length ? (
              <ul className="items">
                {properties.map((p) => (
                  <PropertyCard
                    key={p._id}
                    property={p}
                    typeLabel={labelOf(options?.propertyTypes, p.type)}
                    onDelete={() => remove('properties', p._id, p.label)}
                  />
                ))}
              </ul>
            ) : (
              <p className="muted">No properties yet. Add the house, apartment or land you want us to look after.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Your family in Sri Lanka</h2>
              <Link to="/customer/family/new" className="btn btn--ghost btn--small">
                Add family member
              </Link>
            </div>
            {familyMembers.length ? (
              <ul className="items">
                {familyMembers.map((m) => (
                  <FamilyCard
                    key={m._id}
                    member={m}
                    relationshipLabel={labelOf(options?.relationships, m.relationship)}
                    onDelete={() => remove('family', m._id, m.name)}
                  />
                ))}
              </ul>
            ) : (
              <p className="muted">No family members yet. Add a parent or relative who would like welfare visits.</p>
            )}
          </section>
        </div>

        <div className="stack">
          {/* Bookings and visit reports appear here once the booking module (Salpitikorala) and reports (Ahmed) land */}
          <section className="panel">
            <h2 className="panel__title">Your bookings</h2>
            <div className="empty">
              <CalendarDays size={28} aria-hidden="true" />
              <p>
                <strong>No bookings yet</strong>
              </p>
              <p className="muted small">
                Upcoming and past visits will show here, with a link to the visit report and photos for each one.
              </p>
              <Link to="/services" className="btn btn--primary btn--small">
                Browse services
              </Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Your details</h2>
              <Link to="/customer/profile" className="btn btn--ghost btn--small">
                Edit
              </Link>
            </div>
            <dl className="profile">
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Phone</dt>
              <dd>{user.phone}</dd>
              <dt>Lives in</dt>
              <dd>{options?.countries.find((c) => c.code === user.country)?.name ?? user.country ?? 'Not set'}</dd>
              <dt>Language</dt>
              <dd>{labelOf(options?.languages, user.preferredLanguage)}</dd>
              <dt>Time zone</dt>
              <dd>{user.timeZone ?? 'Not set'}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
