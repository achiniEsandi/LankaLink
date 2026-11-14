import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CalendarCheck,
  Headset,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import HomeScene from '../components/illustrations/HomeScene'
import Photo from '../components/Photo'
import { CONTACT, PLANS, formatRs } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'

const TRUST = [
  { icon: ShieldCheck, title: 'Verified professionals', text: 'Every provider’s NIC and police clearance report is checked by our team before their first job.' },
  { icon: MapPin, title: 'GPS check-in', text: 'Providers check in at your property, so you know exactly when someone arrived and left.' },
  { icon: Camera, title: 'Photo proof', text: 'Photos and notes from every visit, sent to you as it happens, wherever you live.' },
  { icon: Wallet, title: 'Pay only when it’s done', text: 'Your payment is released to the provider only after you confirm the work.' },
]

const STEPS = [
  { title: 'Choose a service', text: 'Pick what you need and the home or family member it is for.' },
  { title: 'We assign a verified professional', text: 'Matched by service, area, availability and rating.' },
  { title: 'Get a visit report', text: 'Check-in time, photos and notes, straight to your phone.' },
]

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function Home() {
  const [services, setServices] = useState([])
  // Photo collage once real photos are in public/images; the illustration until then
  const [hasPhotos, setHasPhotos] = useState(null)

  useEffect(() => {
    api('/providers/options')
      .then((o) => setServices(o.services))
      .catch(() => {})
    const probe = new Image()
    probe.onload = () => setHasPhotos(true)
    probe.onerror = () => setHasPhotos(false)
    probe.src = '/images/svc-house_cleaning.jpg'
  }, [])

  const byValue = Object.fromEntries(services.map((s) => [s.value, s]))
  const collage = ['house_cleaning', 'garden_maintenance', 'family_welfare_visit', 'minor_repairs']

  return (
    <div className="landing">
      {/* ---------- Hero ---------- */}
      <section className="hero-uc">
        <div className="hero-uc__left">
          <h1 className="hero-uc__title">Home and family care in Sri Lanka, while you’re away</h1>
          <p className="hero-uc__lead">
            Verified local professionals for cleaning, repairs, gardens and visits to your parents, with photo proof of
            every visit.
          </p>

          <div className="picker">
            <p className="picker__title">What are you looking for?</p>
            <div className="picker__grid">
              {services.map((s) => {
                const Icon = SERVICE_ICONS[s.value]
                return (
                  <button key={s.value} type="button" className="picker__item" onClick={() => scrollTo(`service-${s.value}`)}>
                    <span className="picker__icon" aria-hidden="true">
                      {Icon && <Icon size={24} />}
                    </span>
                    <span className="picker__label">{s.label}</span>
                  </button>
                )
              })}
              {services.length > 0 && (
                <button type="button" className="picker__item" onClick={() => scrollTo('plans')}>
                  <span className="picker__icon picker__icon--accent" aria-hidden="true">
                    <LayoutGrid size={24} />
                  </span>
                  <span className="picker__label">Monthly plans</span>
                </button>
              )}
            </div>
          </div>

          <ul className="hero-uc__trust">
            <li>
              <BadgeCheck size={18} aria-hidden="true" /> NIC and police verified
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" /> GPS check-in
            </li>
            <li>
              <Camera size={18} aria-hidden="true" /> Photo report every visit
            </li>
          </ul>
        </div>

        {hasPhotos ? (
          <div className="collage" aria-hidden="true">
            {collage.map((value, i) => (
              <Photo
                key={value}
                name={`svc-${value}`}
                alt={byValue[value]?.label ?? ''}
                icon={SERVICE_ICONS[value]}
                className={`collage__item collage__item--${i + 1}`}
              />
            ))}
          </div>
        ) : (
          <div className="hero-art" aria-hidden="true">
            {hasPhotos === false && (
              <>
                <HomeScene />
                <p className="hero-art__chip hero-art__chip--top">
                  <MapPin size={15} /> Nimal checked in · 9:02 am
                </p>
                <p className="hero-art__chip hero-art__chip--bottom">
                  <Camera size={15} /> 6 photos added
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="band">
        <div className="band__head">
          <h2>Services</h2>
          <p className="muted">Book a single visit or set it to repeat. Prices start from:</p>
        </div>
        <div className="service-cards">
          {services.map((s) => (
            <article key={s.value} id={`service-${s.value}`} className="service-card">
              <Photo
                name={`svc-${s.value}`}
                alt={s.label}
                icon={SERVICE_ICONS[s.value]}
                className={`service-card__photo tint--${s.value}`}
              />
              <div className="service-card__body">
                <h3>{s.label}</h3>
                <p className="service-card__text">{s.description}</p>
                <p className="service-card__price">
                  From <strong>{formatRs(s.priceFrom)}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Plans ---------- */}
      <section id="plans" className="band">
        <div className="band__head">
          <h2>Monthly care plans</h2>
          <p className="muted">One plan, regular visits, one monthly payment.</p>
        </div>
        <div className="plans">
          {PLANS.map((p) => (
            <article key={p.id} className={`plan plan--${p.id}`}>
              <div className="plan__body">
                <h3>{p.name}</h3>
                <p className="plan__price">
                  {formatRs(p.price)}
                  <span> / month</span>
                </p>
                <ul>
                  {p.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <Photo name={p.photo} alt="" icon={CalendarCheck} className="plan__photo" />
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section className="band">
        <div className="band__head">
          <h2>Why families abroad choose LankaLink</h2>
        </div>
        <div className="trust-grid">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="trust-card">
              <span className="trust-card__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Visit report ---------- */}
      <section id="how-it-works" className="band report-band">
        <div className="report-band__text">
          <h2>See every visit as it happens</h2>
          <ol className="steps-uc">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="steps-uc__num">{i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="phone" aria-label="Example visit report">
          <div className="phone__screen">
            <p className="phone__label">Visit report</p>
            <p className="phone__title">Monthly house check</p>
            <p className="phone__meta">Kiribathgoda, Gampaha · Saturday</p>
            <ul className="phone__log">
              <li>
                <span>9:02</span>Nimal checked in at the house
              </li>
              <li>
                <span>9:40</span>6 photos added: roof, garden, water tank
              </li>
              <li>
                <span>9:55</span>Small leak under the kitchen sink
              </li>
              <li className="phone__done">
                <span>10:01</span>Visit completed
              </li>
            </ul>
            <div className="phone__photos">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Areas + support ---------- */}
      <section className="band areas">
        <div>
          <h2>Starting in Colombo and Gampaha</h2>
          <p className="muted">
            We are verifying professionals in these districts first, then Negombo, Kandy, Galle and Kurunegala.
          </p>
        </div>
        <a href={CONTACT.phoneHref} className="support-chip">
          <Headset size={20} aria-hidden="true" />
          <span>
            Questions? Call us
            <strong>{CONTACT.phone}</strong>
          </span>
        </a>
      </section>

      {/* ---------- Professionals ---------- */}
      <section className="pro-band">
        <div className="pro-band__text">
          <p className="pro-band__eyebrow">For professionals</p>
          <h2>Earn with LankaLink</h2>
          <p>Cleaners, gardeners, technicians and carers: get regular jobs from families near you.</p>
          <Link to="/professionals" className="btn btn--light">
            Join as a professional <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <Photo name="pro-hero" alt="A LankaLink professional" icon={BadgeCheck} className="pro-band__photo" />
      </section>
    </div>
  )
}
