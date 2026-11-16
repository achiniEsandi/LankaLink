import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { browserTimeZone, INTL_PHONE_PATTERN, normaliseIntlPhone, useOptions } from '../lib/customer'

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter your full name'
  if (!INTL_PHONE_PATTERN.test(normaliseIntlPhone(form.phone))) {
    errors.phone = 'Start with + and your country code, e.g. +44 7700 900123'
  }
  if (!form.country) errors.country = 'Choose the country you live in'
  if (!form.timeZone) errors.timeZone = 'Choose your time zone'
  return errors
}

const formFrom = (user) => ({
  name: user.name ?? '',
  phone: user.phone ?? '',
  country: user.country ?? '',
  preferredLanguage: user.preferredLanguage ?? 'en',
  timeZone: user.timeZone ?? '',
})

export default function CustomerProfile() {
  const { token, user, updateUser } = useAuth()
  const { data: options, error: optionsError } = useOptions('/customers/options')
  const [form, setForm] = useState(() => formFrom(user))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Start from the latest saved details, not the copy kept at login
  useEffect(() => {
    api('/customers/me', { token })
      .then(({ user: fresh }) => {
        updateUser(fresh)
        setForm(formFrom(fresh))
      })
      .catch(() => {})
  }, [token, updateUser])

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setStatus(null)
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setStatus(null)
    try {
      const { user: saved } = await api('/customers/me', {
        method: 'PATCH',
        token,
        body: { ...form, name: form.name.trim(), phone: normaliseIntlPhone(form.phone) },
      })
      updateUser(saved)
      setForm(formFrom(saved))
      setStatus({ tone: 'success', text: 'Your details are saved.' })
    } catch (err) {
      if (err.details) setErrors(err.details)
      else setStatus({ tone: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const detected = browserTimeZone()

  return (
    <div className="page-form">
      <Link to="/customer/dashboard" className="back-link">
        ← Back to my account
      </Link>
      <h1>Your details</h1>
      <p className="muted">We use your language and time zone when we contact you and show visit times.</p>

      {optionsError && <p className="alert alert--error">We could not load the form. Refresh the page to try again.</p>}

      <form onSubmit={handleSubmit} noValidate className="panel">
        <Field label="Full name" error={errors.name}>
          {(p) => <input {...p} value={form.name} onChange={update('name')} autoComplete="name" />}
        </Field>
        <Field label="Email address" hint="Your login email cannot be changed here. Contact us if you need to change it.">
          {(p) => <input {...p} value={user?.email ?? ''} disabled />}
        </Field>
        <Field label="Phone number" hint="Include your country code" error={errors.phone}>
          {(p) => (
            <input {...p} type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" className="input--short" />
          )}
        </Field>
        <Field label="Country you live in" error={errors.country}>
          {(p) => (
            <select {...p} value={form.country} onChange={update('country')} className="input--short">
              <option value="">Choose a country</option>
              {options?.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <fieldset className="group">
          <legend className="group__label">Preferred language</legend>
          <div className="pills" role="radiogroup">
            {options?.languages.map((l) => (
              <label key={l.value} className={`pill${form.preferredLanguage === l.value ? ' pill--on' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  checked={form.preferredLanguage === l.value}
                  onChange={() => update('preferredLanguage')({ target: { value: l.value } })}
                />
                {l.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Your time zone"
          hint={
            detected && detected !== form.timeZone ? (
              <>
                This device is set to {detected}.{' '}
                <button type="button" className="link-btn" onClick={() => update('timeZone')({ target: { value: detected } })}>
                  Use it
                </button>
              </>
            ) : undefined
          }
          error={errors.timeZone}
        >
          {(p) => (
            <select {...p} value={form.timeZone} onChange={update('timeZone')} className="input--short">
              <option value="">Choose a time zone</option>
              {options?.timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          )}
        </Field>

        {status && (
          <p className={`alert alert--${status.tone}`} role="status">
            {status.text}
          </p>
        )}

        <div className="actions">
          <button type="submit" className="btn btn--primary" disabled={submitting || !options}>
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
