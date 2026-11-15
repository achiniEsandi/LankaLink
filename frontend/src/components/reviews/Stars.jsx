import { Star } from 'lucide-react'
import { useState } from 'react'

// Read-only stars, e.g. ★★★★☆
export function Stars({ value, size = 16 }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? 'stars__on' : 'stars__off'} aria-hidden="true" />
      ))}
    </span>
  )
}

const WORDS = ['', 'Poor', 'Below expectations', 'Okay', 'Good', 'Excellent']

// Tap a star to rate; keyboard users get real radio buttons underneath
export function StarInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <fieldset className="star-input">
      <legend className="field__label">Your rating</legend>
      <div className="star-input__row" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="star-input__star" onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} />
            <Star size={36} className={n <= shown ? 'stars__on' : 'stars__off'} aria-hidden="true" />
            <span className="visually-hidden">{n} star{n > 1 ? 's' : ''}</span>
          </label>
        ))}
        <span className="star-input__word">{WORDS[shown]}</span>
      </div>
      {error && <p className="field__error">{error}</p>}
    </fieldset>
  )
}

export function RatingSummary({ average, count, distribution }) {
  if (!count) {
    return (
      <div className="rating-summary rating-summary--empty">
        <Star size={22} aria-hidden="true" />
        <span>No reviews yet</span>
      </div>
    )
  }
  const max = Math.max(...distribution.map((d) => d.count), 1)
  return (
    <div className="rating-summary">
      <div className="rating-summary__score">
        <strong>{average.toFixed(1)}</strong>
        <Stars value={average} />
        <span className="muted small">
          {count} review{count === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="rating-summary__bars">
        {distribution.map((d) => (
          <li key={d.stars}>
            <span>{d.stars}★</span>
            <span className="bar">
              <span className="bar__fill" style={{ width: `${(d.count / max) * 100}%` }} />
            </span>
            <span className="muted">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
