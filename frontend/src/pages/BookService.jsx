import { CalendarDays, CircleCheck, Repeat, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { FREQUENCY_LABELS, PERIOD_HOURS, formatDay } from '../lib/bookings'
import { PERIOD_LABELS } from '../lib/availability'
import { formatRs } from '../lib/marketing'
import { SERVICE_ICONS } from '../lib/serviceIcons'

const EMPTY_LOCATION = { label: '', address: '', district: '', contactName: '', contactPhone: '' }

// Customer booking form: /book, or /book?service=house_cleaning from a service card
export default function BookService() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [options, setOptions] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState({
    service: params.get('service') ?? '',
    date: '',
    period: '',
    repeat: '',
    instructions: '',
    location: { ...EMPTY_LOCATION, contactName: user?.name ?? '' },
  })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState(null)
  const [available, setAvailable] = useState(null)

  useEffect(() => {
    api('/bookings/options')
      .then((o) => {
        setOptions(o)
        setForm((f) => ({ ...f, location: { ...f.location, district: f.location.district || o.launchDistricts[0] } }))
      })
      .catch((err) => setLoadError(err.message))
  }, [])

  // Tell the customer early if nobody can take the chosen slot
  const { service, date, period } = form
  const district = form.location.district
  useEffect(() => {
    if (!service || !date || !period || !district) return undefined
    const q = new URLSearchParams({ service, date, period, district })
    let live = true
    api(`/bookings/availability?${q}`)
      .then((r) => live && setAvailable(r.available))
      .catch(() => live && setAvailable(null))
    return () => {
      live = false
    }
  }, [service, date, period, district])

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    if (['service', 'date', 'period'].includes(key)) setAvailable(null)
  }
  const setLocation = (key, value) => {
    setForm((f) => ({ ...f, location: { ...f.location, [key]: value } }))
    setErrors((e) => ({ ...e, [`location.${key}`]: undefined }))
    if (key === 'district') setAvailable(null)
  }

  function check() {
    const e = {}
    if (!form.service) e.service = 'Choose a service'
    if (!form.date) e.date = 'Choose a date'
    if (!form.period) e.period = 'Choose a time of day'
    if (!form.location.address.trim()) e['location.address'] = 'Enter the address for the visit'
    if (!form.location.district) e['location.district'] = 'Choose the district'
    return e
  }

  async function submit(e) {
    e.preventDefault()
    const found = check()
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector('.field--error, .group .field__error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setState({ busy: true })
    try {
      const { booking } = await api('/bookings', {
        method: 'POST',
        token,
        body: { ...form, repeat: form.repeat || undefined, instructions: form.instructions.trim() || undefined },
      })
      navigate(`/bookings/${booking._id}`, { state: { justBooked: true } })
    } catch (err) {
      setErrors(err.details || {})
      setState({ error: err.message })
    }
  }

  if (loadError) return <p className="alert alert--error">{loadError}</p>
  if (!options) return <p className="muted">Loading…</p>

  const chosen = options.services.find((s) => s.value === form.service)

  return (
    <div className="book">
      <Link to="/bookings" className="back-link">← My bookings</Link>
      <h1 className="page-title">Book a visit</h1>
      <p className="muted">We match you with a verified professional who works in the area and is free at that time.</p>

      <form className="book__grid" onSubmit={submit} noValidate>
        <div className="book__main">
          <fieldset className="group">
            <legend className="group__label">1. What do you need?</legend>
            <div className="tiles">
              {options.services.map((s) => {
                const Icon = SERVICE_ICONS[s.value]
                const on = form.service === s.value
                return (
                  <label key={s.value} className={`tile${on ? ' tile--on' : ''}`}>
                    <input type="radio" name="service" checked={on} onChange={() => set('service', s.value)} />
                    {Icon && (
                      <span className="tile__icon" aria-hidden="true">
                        <Icon size={20} />
                      </span>
                    )}
                    {on && <CircleCheck className="tile__tick" size={22} aria-hidden="true" />}
                    <span className="tile__title">{s.label}</span>
                    <span className="tile__text">{formatRs(s.price)} per visit</span>
                  </label>
                )
              })}
            </div>
            {errors.service && <p className="field__error">{errors.service}</p>}
          </fieldset>

          <fieldset className="group">
            <legend className="group__label">2. When?</legend>
            <div className="grid-2">
              <Field label="Date" error={errors.date} hint={`Up to ${options.maxDaysAhead} days ahead`}>
                {(p) => (
                  <input
                    {...p}
                    type="date"
                    min={options.minDate}
                    max={options.maxDate}
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                  />
                )}
              </Field>
            </div>
            <div className="pills" role="radiogroup" aria-label="Time of day">
              {options.periods.map((p) => (
                <label key={p.value} className={`pill pill--tall${form.period === p.value ? ' pill--on' : ''}`}>
                  <input type="radio" name="period" checked={form.period === p.value} onChange={() => set('period', p.value)} />
                  <strong>{PERIOD_LABELS[p.value]}</strong>
                  <span className="small">{PERIOD_HOURS[p.value]}</span>
                </label>
              ))}
            </div>
            {errors.period && <p className="field__error">{errors.period}</p>}

            <p className="group__hint book__repeat-label">
              <Repeat size={15} aria-hidden="true" /> Repeat this visit?
            </p>
            <div className="pills" role="radiogroup" aria-label="Repeat">
              {[['', 'Just once'], ...Object.entries(FREQUENCY_LABELS)].map(([value, label]) => (
                <label key={value || 'once'} className={`pill${form.repeat === value ? ' pill--on' : ''}`}>
                  <input type="radio" name="repeat" checked={form.repeat === value} onChange={() => set('repeat', value)} />
                  {label}
                </label>
              ))}
            </div>
            {errors.repeat && <p className="field__error">{errors.repeat}</p>}
          </fieldset>

          <fieldset className="group">
            <legend className="group__label">3. Where?</legend>
            <Field label="Address" error={errors['location.address']}>
              {(p) => (
                <textarea
                  {...p}
                  rows="2"
                  maxLength={300}
                  value={form.location.address}
                  onChange={(e) => setLocation('address', e.target.value)}
                  placeholder="House number, street, town"
                />
              )}
            </Field>
            <div className="grid-2">
              <Field label="District" error={errors['location.district']}>
                {(p) => (
                  <select {...p} value={form.location.district} onChange={(e) => setLocation('district', e.target.value)}>
                    <option value="">Choose…</option>
                    {options.districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Name for this place" optional hint="e.g. Amma’s house">
                {(p) => (
                  <input {...p} maxLength={80} value={form.location.label} onChange={(e) => setLocation('label', e.target.value)} />
                )}
              </Field>
              <Field label="Person to meet" optional error={errors['location.contactName']}>
                {(p) => (
                  <input {...p} maxLength={100} value={form.location.contactName} onChange={(e) => setLocation('contactName', e.target.value)} />
                )}
              </Field>
              <Field label="Their phone number" optional error={errors['location.contactPhone']} hint="Shared only with the professional who accepts">
                {(p) => (
                  <input
                    {...p}
                    type="tel"
                    maxLength={20}
                    value={form.location.contactPhone}
                    onChange={(e) => setLocation('contactPhone', e.target.value)}
                  />
                )}
              </Field>
            </div>
            <Field label="Anything the professional should know?" optional error={errors.instructions}>
              {(p) => (
                <textarea
                  {...p}
                  rows="3"
                  maxLength={1000}
                  value={form.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                  placeholder="Gate code, pets, which rooms, tools available…"
                />
              )}
            </Field>
          </fieldset>
        </div>

        <aside className="book__side">
          <div className="panel book__summary">
            <h2 className="panel__title">Summary</h2>
            <dl className="summary-list">
              <div>
                <dt>Service</dt>
                <dd>{chosen?.label ?? '—'}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>
                  {form.date ? formatDay(form.date) : '—'}
                  {form.period && `, ${PERIOD_LABELS[form.period].toLowerCase()}`}
                </dd>
              </div>
              <div>
                <dt>Repeats</dt>
                <dd>{form.repeat ? FREQUENCY_LABELS[form.repeat] : 'No'}</dd>
              </div>
              <div>
                <dt>Where</dt>
                <dd>{form.location.district || '—'}</dd>
              </div>
              <div className="summary-list__total">
                <dt>Price per visit</dt>
                <dd>{chosen ? formatRs(chosen.price) : '—'}</dd>
              </div>
            </dl>

            {available !== null && (
              <p className={`avail-note${available ? '' : ' avail-note--none'}`}>
                {available ? (
                  <>
                    <CalendarDays size={16} aria-hidden="true" /> {available} professional{available === 1 ? '' : 's'} free at this time
                  </>
                ) : (
                  <>
                    <TriangleAlert size={16} aria-hidden="true" /> Nobody is free at this time yet. You can still book and we’ll keep
                    looking, or try another time.
                  </>
                )}
              </p>
            )}

            {state?.error && <p className="alert alert--error" role="alert">{state.error}</p>}
            <button type="submit" className="btn btn--ink btn--block btn--lg" disabled={state?.busy}>
              {state?.busy ? 'Booking…' : 'Confirm booking'}
            </button>
            <p className="small muted">Free cancellation until the professional checks in.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}
