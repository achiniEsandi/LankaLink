import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDuration } from './helpers'

// Simple illustrated map of the Colombo corridor (700 x 360 drawing units, as in the sample data)
function CorridorMap({ provider }) {
  const { mapStart: a, mapEnd: b, checkedIn } = provider
  const route = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 32} ${b.x} ${b.y}`
  const here = checkedIn ? b : a

  return (
    <svg className="ops-map" viewBox="0 0 700 360" role="img" aria-label={`${provider.name}: ${checkedIn ? 'on site' : 'on the way'}`}>
      {/* Sea along the west coast */}
      <path d="M0 0 H120 C100 80 140 160 105 240 C85 300 110 330 95 360 H0 Z" className="ops-map__sea" />
      <text x="40" y="190" className="ops-map__label ops-map__label--sea" transform="rotate(-90 40 190)">
        Indian Ocean
      </text>
      {/* Main roads */}
      <path d="M130 30 C160 120 150 220 175 350" className="ops-map__road" />
      <path d="M150 140 C300 120 450 150 680 120" className="ops-map__road" />
      <path d="M160 260 C330 240 480 270 680 230" className="ops-map__road" />
      <path d="M400 20 C420 120 390 230 420 350" className="ops-map__road ops-map__road--minor" />
      <path d="M560 30 C540 130 580 240 560 350" className="ops-map__road ops-map__road--minor" />
      {/* Area names */}
      <text x="250" y="105" className="ops-map__label">Kollupitiya</text>
      <text x="440" y="100" className="ops-map__label">Cinnamon Gardens</text>
      <text x="590" y="205" className="ops-map__label">Rajagiriya</text>
      <text x="230" y="320" className="ops-map__label">Bambalapitiya</text>
      {/* Route, destination and provider */}
      <path d={route} className="ops-map__route" />
      <g transform={`translate(${b.x} ${b.y})`}>
        <circle r="22" className="ops-map__halo" />
        <circle r="7" className="ops-map__dest" />
        <text y="-16" textAnchor="middle" className="ops-map__label ops-map__label--strong">
          Customer's home
        </text>
      </g>
      <g className="ops-map__provider" style={{ transform: `translate(${here.x}px, ${here.y}px)` }}>
        <circle r="16" className={`ops-map__pulse${checkedIn ? ' ops-map__pulse--on' : ''}`} />
        <circle r="8" className={`ops-map__me${checkedIn ? ' ops-map__me--on' : ''}`} />
      </g>
    </svg>
  )
}

export default function GpsTab({ providers, selectedId, onSelect, onToggleCheckIn, onRefreshLocation }) {
  const provider = providers.find((p) => p.id === selectedId) ?? providers[0]
  const [now, setNow] = useState(() => Date.now())

  // Live elapsed time for checked-in providers
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = provider.checkedIn && provider.checkedInAt ? Math.max(0, Math.floor((now - provider.checkedInAt) / 1000)) : null

  return (
    <div className="ops-grid">
      <section className="panel">
        <div className="panel__title-row">
          <div>
            <h2 className="panel__title">{provider.name}</h2>
            <p className="small muted">
              {provider.specialty} · heading to {provider.destination}
            </p>
          </div>
          <span className={`status-chip status-chip--${provider.checkedIn ? 'approved' : 'pending'}`}>
            {provider.checkedIn ? 'On site' : 'On the way'}
          </span>
        </div>
        <CorridorMap provider={provider} />
        <dl className="ops-telemetry">
          <div>
            <dt>Arrives in</dt>
            <dd>{provider.checkedIn ? 'Arrived' : `${provider.etaMinutes} min`}</dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{provider.checkedIn ? '0 km' : `${provider.distanceKm} km`}</dd>
          </div>
          <div>
            <dt>GPS</dt>
            <dd className="mono">
              {provider.coordinates.lat.toFixed(4)}° N, {provider.coordinates.lng.toFixed(4)}° E
            </dd>
          </div>
          <div>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => onRefreshLocation(provider.id)}>
              <RefreshCw size={14} aria-hidden="true" /> Refresh location
            </button>
          </div>
        </dl>
      </section>

      <div className="ops-side">
        <section className="panel">
          <h2 className="panel__title">Providers on duty</h2>
          <div className="ops-links">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ops-link${p.id === provider.id ? ' ops-link--on' : ''}`}
                aria-pressed={p.id === provider.id}
                onClick={() => onSelect(p.id)}
              >
                <span className="avatar avatar--initials ops-avatar" aria-hidden="true">
                  {p.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <span className="small muted">{p.district}</span>
                </span>
                <span className={`status-chip status-chip--${p.checkedIn ? 'approved' : 'pending'}`}>
                  {p.checkedIn ? 'On site' : 'En route'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__title">Check-in</h2>
          {provider.checkedIn ? (
            <>
              <p className="small muted">Time on site</p>
              <p className="ops-timer mono">{formatDuration(elapsed ?? 0)}</p>
            </>
          ) : (
            <p className="small muted">
              <MapPin size={14} aria-hidden="true" /> Check-in is allowed once the provider is inside the customer's GPS area.
            </p>
          )}
          {provider.lastDurationSec && !provider.checkedIn && (
            <p className="small">
              Last visit: <span className="mono">{formatDuration(provider.lastDurationSec)}</span>
            </p>
          )}
          <button
            type="button"
            className={`btn btn--block ${provider.checkedIn ? 'btn--ghost' : 'btn--ink'}`}
            onClick={() => onToggleCheckIn(provider.id)}
          >
            <Navigation size={16} aria-hidden="true" /> {provider.checkedIn ? 'Check out' : 'Check in'}
          </button>
        </section>
      </div>
    </div>
  )
}
