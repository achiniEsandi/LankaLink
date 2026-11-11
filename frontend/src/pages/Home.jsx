import { Link } from 'react-router'

export default function Home() {
  return (
    <div className="home">
      <section className="home__intro">
        <h1>Someone you can trust to look after home, while you are away.</h1>
        <p className="lead">
          LankaLink connects Sri Lankans living overseas with checked local people who clean, repair, garden and
          visit family. Every visit comes with a check-in and photos, so you know it was done.
        </p>
        <div className="home__actions">
          <Link to="/provider/register" className="btn btn--primary">I want to work with LankaLink</Link>
          <Link to="/login" className="btn btn--ghost">Log in</Link>
        </div>
      </section>

      <aside className="sample-visit" aria-label="Example of a visit report">
        <p className="sample-visit__label">Example visit report</p>
        <p className="sample-visit__title">Monthly house check</p>
        <p className="muted small">Kiribathgoda, Gampaha · Saturday</p>
        <ul className="sample-visit__log">
          <li><span>9:02 am</span> Nimal checked in at the house</li>
          <li><span>9:40 am</span> 6 photos added: roof, garden, water tank</li>
          <li><span>9:55 am</span> Note: small leak under kitchen sink</li>
          <li><span>10:01 am</span> Visit completed</li>
        </ul>
      </aside>

      <section className="home__providers">
        <h2>Looking for work?</h2>
        <p className="muted">
          If you clean, garden, fix things or care for people, LankaLink sends you regular jobs from families nearby.
        </p>
        <ol className="how">
          <li>
            <strong>Sign up</strong>
            <span>Tell us what you do and where you can work. About 5 minutes.</span>
          </li>
          <li>
            <strong>Get verified</strong>
            <span>Upload your NIC and police report. We check them within 2 working days.</span>
          </li>
          <li>
            <strong>Start working</strong>
            <span>Accept jobs near you and get paid through LankaLink.</span>
          </li>
        </ol>
      </section>
    </div>
  )
}
