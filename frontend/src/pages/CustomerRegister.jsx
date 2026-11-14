import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { JobsSpot } from '../components/illustrations/Spots'
import PasswordInput from '../components/PasswordInput'
import { browserTimeZone, EMAIL_PATTERN, INTL_PHONE_PATTERN, normaliseIntlPhone, useOptions } from '../lib/customer'

const EMPTY_FORM = { name: '', email: '', country: '', phone: '', password: '' }

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter your full name'
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter an email address like name@gmail.com'
  if (!form.country) errors.country = 'Choose the country you live in'
  if (!INTL_PHONE_PATTERN.test(normaliseIntlPhone(form.phone))) {
    errors.phone = 'Start with + and your country code, e.g. +44 7700 900123'
  }
  if (form.password.length < 8) errors.password = 'Use at least 8 characters'
  return errors
}

export default function CustomerRegister() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { data: options, error: optionsError } = useOptions('/customers/options')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      const timeZone = browserTimeZone()
      const { token, user } = await api('/customers/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          country: form.country,
          phone: normaliseIntlPhone(form.phone),
          password: form.password,
          timeZone: options?.timeZones.includes(timeZone) ? timeZone : undefined,
        },
      })
      signIn(token, user)
      navigate('/customer/dashboard', { replace: true, state: { justRegistered: true } })
    } catch (err) {
      if (err.details) setErrors(err.details)
      else if (err.status === 409) setErrors({ email: 'An account with this email already exists. Try logging in.' })
      else setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signup">
      <aside className="signup__side">
        <div className="signup__art">
          <JobsSpot />
        </div>
        <p className="eyebrow">For families abroad</p>
        <h1 className="signup__title">Create your account</h1>
        <p className="muted">
          Book checked local helpers for your home and family in Sri Lanka, and see a report after every visit.
        </p>
        <div className="side-note">
          <strong>After you sign up</strong>
          <ul>
            <li>Add the homes you want looked after</li>
            <li>Add family members who would like visits</li>
            <li>Choose a service and book</li>
          </ul>
        </div>
      </aside>

      <section className="signup__main">
        <h2 className="step-title">Your details</h2>

        {optionsError && (
          <p className="alert alert--error" role="alert">
            We could not load the form. Check your connection and refresh the page.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Full name" error={errors.name}>
            {(p) => <input {...p} value={form.name} onChange={update('name')} autoComplete="name" />}
          </Field>
          <Field label="Email address" hint="You will use this to log in" error={errors.email}>
            {(p) => (
              <input {...p} type="email" inputMode="email" value={form.email} onChange={update('email')} autoComplete="email" />
            )}
          </Field>
          <Field label="Country you live in" error={errors.country}>
            {(p) => (
              <select {...p} value={form.country} onChange={update('country')} autoComplete="country" className="input--short">
                <option value="">Choose a country</option>
                {options?.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Phone number" hint="Include your country code, e.g. +44 7700 900123" error={errors.phone}>
            {(p) => (
              <input
                {...p}
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+44 7700 900123"
                autoComplete="tel"
                className="input--short"
              />
            )}
          </Field>
          <Field label="Create a password" hint="At least 8 characters" error={errors.password}>
            {(p) => <PasswordInput {...p} value={form.password} onChange={update('password')} autoComplete="new-password" />}
          </Field>

          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}

          <div className="actions">
            <button type="submit" className="btn btn--primary" disabled={submitting || !options}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>

        <p className="muted small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  )
}
