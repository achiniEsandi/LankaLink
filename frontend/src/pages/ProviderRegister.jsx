import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'

// Mirrors the backend checks so most mistakes are caught before submitting
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  nic: '',
  password: '',
  confirmPassword: '',
  services: [],
  serviceAreas: [],
  experienceYears: '',
  bio: '',
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter your full name'
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Use a Sri Lankan mobile number, e.g. 0771234567'
  if (!NIC_PATTERN.test(form.nic.trim())) errors.nic = 'Enter a valid NIC (e.g. 901234567V or 199012345678)'
  if (form.password.length < 8) errors.password = 'Use at least 8 characters'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match'
  if (!form.services.length) errors.services = 'Select at least one service'
  if (!form.serviceAreas.length) errors.serviceAreas = 'Select at least one district'
  if (form.experienceYears !== '' && !(Number(form.experienceYears) >= 0 && Number(form.experienceYears) <= 60)) {
    errors.experienceYears = 'Enter a number between 0 and 60'
  }
  return errors
}

function Field({ label, error, hint, children }) {
  return (
    <label className={`field${error ? ' field--error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export default function ProviderRegister() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [options, setOptions] = useState({ services: [], districts: [] })
  const [optionsError, setOptionsError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('/providers/options').then(setOptions).catch((err) => setOptionsError(err.message))
  }, [])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const toggle = (field, value) => () =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }))

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      const { token, user } = await api('/providers/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          nic: form.nic.trim(),
          password: form.password,
          services: form.services,
          serviceAreas: form.serviceAreas,
          experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
          bio: form.bio.trim() || undefined,
        },
      })
      signIn(token, user)
      navigate('/provider/dashboard', { replace: true })
    } catch (err) {
      setErrors(err.details || {})
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card card--wide">
      <h1>Become a LankaLink provider</h1>
      <p className="muted">
        Register to offer your services to families and property owners. Your account will be reviewed by our
        team before you can receive bookings.
      </p>

      {optionsError && <p className="alert alert--error">Could not load the form: {optionsError}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend>Your details</legend>
          <div className="grid-2">
            <Field label="Full name" error={errors.name}>
              <input value={form.name} onChange={update('name')} autoComplete="name" />
            </Field>
            <Field label="NIC number" error={errors.nic}>
              <input value={form.nic} onChange={update('nic')} placeholder="199012345678" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
            </Field>
            <Field label="Mobile number" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={update('phone')} placeholder="0771234567" autoComplete="tel" />
            </Field>
            <Field label="Password" error={errors.password} hint="At least 8 characters">
              <input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" error={errors.confirmPassword}>
              <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} autoComplete="new-password" />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Services you offer</legend>
          <div className="checks">
            {options.services.map((s) => (
              <label key={s.value} className="check">
                <input type="checkbox" checked={form.services.includes(s.value)} onChange={toggle('services', s.value)} />
                {s.label}
              </label>
            ))}
          </div>
          {errors.services && <p className="field__error">{errors.services}</p>}
        </fieldset>

        <fieldset>
          <legend>Districts you can work in</legend>
          <div className="checks checks--compact">
            {options.districts.map((d) => (
              <label key={d} className="check">
                <input type="checkbox" checked={form.serviceAreas.includes(d)} onChange={toggle('serviceAreas', d)} />
                {d}
              </label>
            ))}
          </div>
          {errors.serviceAreas && <p className="field__error">{errors.serviceAreas}</p>}
        </fieldset>

        <fieldset>
          <legend>About your experience</legend>
          <Field label="Years of experience" error={errors.experienceYears}>
            <input type="number" min="0" max="60" value={form.experienceYears} onChange={update('experienceYears')} />
          </Field>
          <Field label="Short introduction (optional)" error={errors.bio} hint={`${form.bio.length}/1000`}>
            <textarea rows="4" maxLength={1000} value={form.bio} onChange={update('bio')} />
          </Field>
        </fieldset>

        {formError && <p className="alert alert--error">{formError}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting || !!optionsError}>
          {submitting ? 'Creating account…' : 'Create provider account'}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  )
}
