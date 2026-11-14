import { Camera, CircleCheck, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import HomeScene from '../components/illustrations/HomeScene'
import { JobsSpot, SignUpSpot, VerifiedSpot } from '../components/illustrations/Spots'

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
          <Link to="/signup" className="btn btn--primary">Get started</Link>
          <Link to="/services" className="btn btn--ghost">See services and prices</Link>
        </div>
      </section>

      <div className="home__art">
        <HomeScene />
        <p className="float-chip float-chip--top" aria-hidden="true">
          <MapPin size={16} /> Nimal checked in · 9:02 am
        </p>
        <p className="float-chip float-chip--bottom" aria-hidden="true">
          <Camera size={16} /> 6 photos added
        </p>
      </div>

      <section className="home__report">
        <div>
          <h2>Know exactly what happened at every visit</h2>
          <p className="muted">
            Providers check in at the house with GPS, add photos as they work and leave notes. Families abroad see it
            all on their phone, as it happens.
          </p>
        </div>
        <div className="sample-visit" aria-label="Example of a visit report">
          <p className="sample-visit__label">Example visit report</p>
          <p className="sample-visit__title">Monthly house check</p>
          <p className="muted small">Kiribathgoda, Gampaha · Saturday</p>
          <ul className="sample-visit__log">
            <li><span>9:02 am</span> Nimal checked in at the house</li>
            <li><span>9:40 am</span> 6 photos added: roof, garden, water tank</li>
            <li><span>9:55 am</span> Note: small leak under kitchen sink</li>
            <li>
              <span>10:01 am</span>
              <strong className="done-line"><CircleCheck size={16} /> Visit completed</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="home__providers">
        <h2>Looking for work?</h2>
        <p className="muted">
          If you clean, garden, fix things or care for people, LankaLink sends you regular jobs from families nearby.
        </p>
        <ol className="how">
          <li>
            <SignUpSpot />
            <strong>1. Sign up</strong>
            <span>Tell us what you do and where you can work. About 5 minutes.</span>
          </li>
          <li>
            <VerifiedSpot />
            <strong>2. Get verified</strong>
            <span>Upload your NIC and police report. We check them within 2 working days.</span>
          </li>
          <li>
            <JobsSpot />
            <strong>3. Start working</strong>
            <span>Accept jobs near you and get paid through LankaLink.</span>
          </li>
        </ol>
        <Link to="/provider/register" className="btn btn--primary">Start your application</Link>
      </section>
    </div>
  )
}
