import { BadgeCheck, CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { experienceLabel } from '../lib/provider'
import { formatRupees } from '../lib/customer'
import { SERVICE_ICONS } from '../lib/serviceIcons'

function ProviderList({ service, district }) {
  const [providers, setProviders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const query = new URLSearchParams({ service, ...(district && { district }) })
    api(`/services/providers?${query}`)
      .then(setProviders)
      .catch((err) => setError(err.message))
  }, [service, district])

  if (error) return <p className="field__error">{error}</p>
  if (!providers) return <p className="muted small">Loading providers…</p>
  if (!providers.length) {
    return (
      <p className="muted small">
        No verified providers for this service {district ? `in ${district}` : ''} yet. We are adding more every week.
      </p>
    )
  }

  return (
    <ul className="provider-list">
      {providers.map((p) => (
        <li key={p.id} className="provider-row">
          <div>
            <p className="provider-row__name">
              {p.name}
              {p.verified && (
                <span className="verified">
                  <BadgeCheck size={15} aria-hidden="true" /> Verified
                </span>
              )}
            </p>
            <p className="muted small">
              {experienceLabel(p.experienceYears)} experience · Works in {p.serviceAreas.join(', ')}
            </p>
            {p.bio && <p className="provider-row__bio">{p.bio}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Services() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const district = params.get('district') ?? ''
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    api(`/services${district ? `?district=${encodeURIComponent(district)}` : ''}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [district])

  const chooseDistrict = (value) => {
    setOpen(null)
    setParams(value ? { district: value } : {}, { replace: true })
  }

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading services…</p>

  return (
    <div className="services">
      <header className="services__head">
        <div>
          <p className="eyebrow">Services</p>
          <h1>What we can do for you in Sri Lanka</h1>
          <p className="lead">Every provider is checked: NIC, police clearance and an interview before their first job.</p>
        </div>
        <div className="field services__filter">
          <label htmlFor="district" className="field__label">
            Where is the home or family member?
          </label>
          <select id="district" value={district} onChange={(e) => chooseDistrict(e.target.value)}>
            <option value="">All districts</option>
            {data.districts.map((d) => (
              <option key={d} value={d}>
                {d}
                {data.launchDistricts.includes(d) ? ' (available now)' : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {district && !data.launchDistricts.includes(district) && (
        <p className="note">
          We are starting in {data.launchDistricts.join(' and ')}. In {district} there may be fewer providers for now.
        </p>
      )}

      <ul className="service-grid">
        {data.services.map((s) => {
          const Icon = SERVICE_ICONS[s.value]
          const isOpen = open === s.value
          return (
            <li key={s.value} className="service-card">
              <div className="service-card__top">
                {Icon && (
                  <span className="tile__icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                )}
                <p className="service-card__price">
                  <span className="muted small">from</span> {formatRupees(s.priceFrom)}
                </p>
              </div>
              <h2 className="service-card__title">{s.label}</h2>
              <p className="muted small">{s.description}</p>
              <p className="service-card__count">
                {s.providerCount
                  ? `${s.providerCount} verified provider${s.providerCount === 1 ? '' : 's'}${district ? ` in ${district}` : ''}`
                  : `No providers${district ? ` in ${district}` : ''} yet`}
              </p>
              <button
                type="button"
                className="link-btn"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : s.value)}
                disabled={!s.providerCount}
              >
                {isOpen ? 'Hide providers' : 'See providers'}
              </button>
              {isOpen && <ProviderList service={s.value} district={district} />}
            </li>
          )
        })}
      </ul>

      <section className="packages">
        <h2>Monthly packages</h2>
        <p className="muted">Regular visits on a schedule, for one fixed price each month.</p>
        <div className="package-grid">
          {data.packages.map((p) => (
            <article key={p.key} className="package">
              <h3>{p.name}</h3>
              <p className="package__price">
                {formatRupees(p.pricePerMonth)} <span className="muted small">/ month</span>
              </p>
              <p className="muted small">{p.description}</p>
              <ul className="package__list">
                {p.includes.map((s) => (
                  <li key={s.value}>
                    <CircleCheck size={15} aria-hidden="true" /> {s.label}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="home__providers services__cta">
        {user?.role === 'customer' ? (
          <>
            <h2>Ready when you are</h2>
            <p className="muted">
              Add your homes and family on your account. Booking opens soon, and you will be able to book from here.
            </p>
            <Link to="/customer/dashboard" className="btn btn--primary">
              Go to my account
            </Link>
          </>
        ) : (
          <>
            <h2>Create a free account</h2>
            <p className="muted">Add the homes and family you want looked after, then book a visit.</p>
            <Link to="/signup" className="btn btn--primary">
              Get started
            </Link>
          </>
        )}
      </section>
    </div>
  )
}
