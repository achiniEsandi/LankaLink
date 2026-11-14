import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { DAY_LABELS, PERIOD_LABELS } from '../../lib/availability'
import { EXPERIENCE_OPTIONS } from '../../lib/provider'
import { SERVICE_ICONS } from '../../lib/serviceIcons'

const toggled = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

export function ServicePicker({ services, value, onChange, error, legend = 'What work can you do?' }) {
  return (
    <fieldset className="group" aria-describedby={error ? 'services-error' : undefined}>
      <legend className="group__label">{legend}</legend>
      <p className="group__hint">Choose everything you are comfortable doing.</p>
      <div className="tiles">
        {services.map((s) => {
          const Icon = SERVICE_ICONS[s.value]
          const on = value.includes(s.value)
          return (
            <label key={s.value} className={`tile${on ? ' tile--on' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => onChange(toggled(value, s.value))} />
              {Icon && (
                <span className="tile__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
              )}
              {on && <CircleCheck className="tile__tick" size={22} aria-hidden="true" />}
              <span className="tile__title">{s.label}</span>
              <span className="tile__text">{s.description}</span>
            </label>
          )
        })}
      </div>
      {error && <p id="services-error" className="field__error">{error}</p>}
    </fieldset>
  )
}

export function ExperiencePicker({ value, onChange, error }) {
  return (
    <fieldset className="group">
      <legend className="group__label">How long have you done this kind of work?</legend>
      <div className="pills" role="radiogroup">
        {EXPERIENCE_OPTIONS.map((o) => (
          <label key={o.value} className={`pill${value === o.value ? ' pill--on' : ''}`}>
            <input type="radio" name="experience" checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="field__error">{error}</p>}
    </fieldset>
  )
}

export function DistrictPicker({ provinces, launchDistricts, value, onChange, error }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const visible = provinces
    .map((p) => ({ ...p, districts: p.districts.filter((d) => d.toLowerCase().includes(q)) }))
    .filter((p) => p.districts.length)

  const setProvince = (districts, on) =>
    onChange(on ? [...new Set([...value, ...districts])] : value.filter((d) => !districts.includes(d)))

  return (
    <>
      <p className="note">
        We are starting in <strong>{launchDistricts.join(' and ')}</strong>, so most jobs will be there at first.
        Only choose districts you can travel to easily.
      </p>

      {value.length > 0 && (
        <div className="chips" aria-label="Selected districts">
          {value.map((d) => (
            <button key={d} type="button" className="chip" onClick={() => onChange(toggled(value, d))} aria-label={`Remove ${d}`}>
              {d} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="district-search" className="field__label">Find a district</label>
        <input
          id="district-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a district name"
          className="input--short"
        />
      </div>

      <div className="provinces">
        {visible.map((p) => {
          const allOn = p.districts.every((d) => value.includes(d))
          return (
            <fieldset key={p.name} className="province">
              <div className="province__head">
                <legend>{p.name}</legend>
                {!q && (
                  <button type="button" className="link-btn" onClick={() => setProvince(p.districts, !allOn)}>
                    {allOn ? 'Clear' : 'Select all'}
                  </button>
                )}
              </div>
              {p.districts.map((d) => (
                <label key={d} className="check">
                  <input type="checkbox" checked={value.includes(d)} onChange={() => onChange(toggled(value, d))} />
                  {d}
                  {launchDistricts.includes(d) && <span className="tag">Most jobs</span>}
                </label>
              ))}
            </fieldset>
          )
        })}
        {!visible.length && <p className="muted">No district matches "{query}".</p>}
      </div>
      {error && <p className="field__error">{error}</p>}
    </>
  )
}

// Availability is stored as [{ day, periods }]; this edits it as a days × periods grid
export function AvailabilityPicker({ days, periods, value, onChange, error }) {
  const isOn = (day, period) => value.some((a) => a.day === day && a.periods.includes(period))

  const set = (day, period) => {
    const current = value.find((a) => a.day === day)?.periods ?? []
    const nextPeriods = toggled(current, period)
    const rest = value.filter((a) => a.day !== day)
    const next = nextPeriods.length ? [...rest, { day, periods: nextPeriods }] : rest
    onChange(days.flatMap((d) => next.filter((a) => a.day === d)))
  }

  const preset = (chosenDays) => onChange(chosenDays.map((day) => ({ day, periods: periods.map((p) => p.value) })))

  return (
    <fieldset className="group">
      <legend className="group__label">When can you usually work?</legend>
      <p className="group__hint">We only send you jobs at these times. You can change this whenever you like.</p>
      <div className="presets">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => preset(days.slice(0, 5))}>Weekdays</button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => preset(days.slice(5))}>Weekends</button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => preset(days)}>Every day</button>
        <button type="button" className="link-btn" onClick={() => onChange([])}>Clear</button>
      </div>
      <div className="avail" role="table" aria-label="Weekly availability">
        <div className="avail__row avail__row--head" role="row">
          <span role="columnheader" />
          {periods.map((p) => (
            <span key={p.value} role="columnheader" className="avail__period">
              {PERIOD_LABELS[p.value]}
              <small>{p.hours}</small>
            </span>
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="avail__row" role="row">
            <span role="rowheader" className="avail__day">{DAY_LABELS[day]}</span>
            {periods.map((p) => {
              const on = isOn(day, p.value)
              return (
                <span key={p.value} role="cell">
                  <button
                    type="button"
                    className={`avail__slot${on ? ' avail__slot--on' : ''}`}
                    aria-pressed={on}
                    aria-label={`${DAY_LABELS[day]} ${PERIOD_LABELS[p.value]}`}
                    onClick={() => set(day, p.value)}
                  >
                    {on ? <CircleCheck size={18} aria-hidden="true" /> : null}
                  </button>
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {error && <p className="field__error">{error}</p>}
    </fieldset>
  )
}
