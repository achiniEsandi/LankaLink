import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { CONTACT } from '../lib/marketing'
import Logo from './Logo'

const YEAR = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo />
          <p className="muted small">
            Verified local professionals who look after homes and families in Sri Lanka, for Sri Lankans living anywhere.
          </p>
        </div>

        <nav aria-label="For customers">
          <p className="site-footer__title">For customers</p>
          <a href="/#services">Services</a>
          <a href="/#plans">Monthly plans</a>
          <a href="/#how-it-works">How it works</a>
        </nav>

        <nav aria-label="For professionals">
          <p className="site-footer__title">For professionals</p>
          <Link to="/professionals">Why join LankaLink</Link>
          <Link to="/provider/register">Register as a professional</Link>
          <Link to="/login">Log in</Link>
        </nav>

        <div>
          <p className="site-footer__title">Contact us</p>
          <a href={CONTACT.phoneHref} className="site-footer__contact">
            <Phone size={15} aria-hidden="true" /> {CONTACT.phone}
          </a>
          <a href={`mailto:${CONTACT.email}`} className="site-footer__contact">
            <Mail size={15} aria-hidden="true" /> {CONTACT.email}
          </a>
          <p className="site-footer__contact muted">
            <MapPin size={15} aria-hidden="true" /> {CONTACT.address}
          </p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {YEAR} LankaLink</span>
        <span>Serving Colombo and Gampaha first</span>
      </div>
    </footer>
  )
}
