import { Link } from 'react-router'

export default function Home() {
  return (
    <section className="hero">
      <h1>Care for your family and property in Sri Lanka, from anywhere</h1>
      <p className="muted">
        Book verified local providers for property inspections, cleaning, garden care, repairs and family welfare
        visits — with GPS check-ins and photo proof of every job.
      </p>
      <div className="hero__actions">
        <Link to="/provider/register" className="btn btn--primary">Become a provider</Link>
        <Link to="/login" className="btn">Log in</Link>
      </div>
    </section>
  )
}
