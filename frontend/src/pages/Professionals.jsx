import { ArrowRight, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import Photo from '../components/Photo'
import { CONTACT } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'

const BENEFITS = [
  { icon: MapPin, title: 'Jobs near you', text: 'Choose the districts you can travel to. We only send jobs there.' },
  { icon: CalendarClock, title: 'Work when you want', text: 'Set the days and times you are free. Change them any time.' },
  { icon: Wallet, title: 'Paid through LankaLink', text: 'Customers pay online, and your payment is released when the job is confirmed.' },
  { icon: BadgeCheck, title: 'A verified badge', text: 'Customers see you are checked by LankaLink, which helps them choose you.' },
]

const STEPS = [
  { title: 'Register', text: 'Tell us your skills and areas. Takes about 5 minutes.' },
  { title: 'Upload documents', text: 'A photo of your NIC (both sides) and your police clearance report.' },
  { title: 'Get verified', text: 'Our team checks your documents, usually within 2 working days.' },
  { title: 'Start working', text: 'Accept jobs near you and build your rating.' },
]

const NEEDS = [
  'Your National Identity Card',
  'A police clearance report',
  'A smartphone with a camera and GPS',
  'Experience in at least one of our services',
]

const FAQ = [
  { q: 'Does it cost anything to join?', a: 'No. Registering is free. LankaLink keeps a small commission from each completed job.' },
  { q: 'How do I get paid?', a: 'Customers pay through LankaLink. Your payment is released after the customer confirms the job is done.' },
  { q: 'Which areas can I work in?', a: 'We are starting in Colombo and Gampaha, then Negombo, Kandy, Galle and Kurunegala.' },
  { q: 'How long does verification take?', a: 'Usually within 2 working days after you upload your documents. We may call you to confirm a few details.' },
  { q: 'Can I choose which jobs I take?', a: 'Yes. You see each request and accept or decline it. Your availability decides which requests you get.' },
]

export default function Professionals() {
  const [services, setServices] = useState([])

  useEffect(() => {
    api('/providers/options')
      .then((o) => setServices(o.services))
      .catch(() => {})
  }, [])

  return (
    <div className="landing">
      <section className="pro-hero">
        <div className="pro-hero__text">
          <p className="eyebrow">LankaLink for professionals</p>
          <h1>Steady work near you, with families who need it</h1>
          <p className="hero-uc__lead">
            Join verified cleaners, gardeners, technicians and carers looking after homes for Sri Lankans living abroad.
          </p>
          <div className="pro-hero__actions">
            <Link to="/provider/register" className="btn btn--ink btn--lg">
              Register now <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Log in
            </Link>
          </div>
          <p className="muted small">Free to join · About 5 minutes</p>
        </div>
        <Photo name="pro-hero" alt="A LankaLink professional at work" icon={Briefcase} className="pro-hero__photo" />
      </section>

      <section className="band">
        <div className="band__head">
          <h2>Why work with LankaLink</h2>
        </div>
        <div className="trust-grid">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
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

      <section className="band">
        <div className="band__head">
          <h2>Work you can offer</h2>
        </div>
        <div className="offer-grid">
          {services.map((s) => {
            const Icon = SERVICE_ICONS[s.value]
            return (
              <div key={s.value} className="offer">
                <span className="picker__icon" aria-hidden="true">
                  {Icon && <Icon size={22} />}
                </span>
                <span>{s.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="band two-col">
        <div>
          <h2>How to join</h2>
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
        <div className="needs">
          <h3>What you need</h3>
          <ul>
            {NEEDS.map((n) => (
              <li key={n}>
                <CheckCircle2 size={18} aria-hidden="true" /> {n}
              </li>
            ))}
          </ul>
          <Link to="/provider/register" className="btn btn--ink btn--block">
            Start your registration
          </Link>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <h2>Questions</h2>
        </div>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="muted small faq__more">
          Something else? Call us on <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
        </p>
      </section>
    </div>
  )
}
