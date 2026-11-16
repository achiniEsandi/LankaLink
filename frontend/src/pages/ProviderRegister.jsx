import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { SignUpSpot } from '../components/illustrations/Spots'
import PasswordInput from '../components/PasswordInput'
import { DistrictPicker, ExperiencePicker, ServicePicker } from '../components/provider/Pickers'
import { experienceLabel, normaliseNic, normalisePhone } from '../lib/provider'

// Mirrors the backend checks so most mistakes are caught before submitting
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const NIC_PATTERN = /^(\d{9}[VX]|\d{12})$/

const DRAFT_KEY = 'lankalink.providerDraft'

const STEPS = [
  { key: 'details', title: 'Your details', fields: ['name', 'phone', 'nic'] },
  { key: 'work', title: 'Your work', fields: ['services', 'experienceYears', 'bio'] },
  { key: 'areas', title: 'Where you work', fields: ['serviceAreas'] },
  { key: 'login', title: 'Your login', fields: ['email', 'password'] },
  { key: 'review', title: 'Check and send', fields: [] },
]

const EMPTY_FORM = {
  name: '',
  phone: '',
  nic: '',
  services: [],
  experienceYears: null,
  bio: '',
  serviceAreas: [],
  email: '',
  password: '',
}

function validateStep(stepIndex, form) {
  const errors = {}
  const step = STEPS[stepIndex].key

  if (step === 'details') {
    if (!form.name.trim()) errors.name = 'Enter your name as it appears on your NIC'
    if (!PHONE_PATTERN.test(normalisePhone(form.phone))) {
      errors.phone = 'Enter a mobile number like 077 123 4567'
    }
    if (!NIC_PATTERN.test(normaliseNic(form.nic))) {
      errors.nic = 'Enter 12 digits, or 9 digits followed by V or X'
    }
  }
  if (step === 'work') {
    if (!form.services.length) errors.services = 'Choose at least one type of work'
    if (form.experienceYears === null) errors.experienceYears = 'Choose how long you have done this work'
  }
  if (step === 'areas' && !form.serviceAreas.length) {
    errors.serviceAreas = 'Choose at least one district'
  }
  if (step === 'login') {
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter an email address like name@gmail.com'
    if (form.password.length < 8) errors.password = 'Use at least 8 characters'
  }
  return errors
}

function loadDraft() {
  try {
    return { ...EMPTY_FORM, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY)) }
  } catch {
    return EMPTY_FORM
  }
}

function saveDraft(form) {
  try {
    // Never keep the password in storage
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, password: '' }))
  } catch {
    // Storage unavailable; the draft just won't survive a reload
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clear
  }
}

function Stepper({ current, onJump }) {
  return (
    <ol className="stepper">
      {STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li key={step.key} className={`stepper__item stepper__item--${state}`}>
            {i < current ? (
              <button type="button" className="stepper__link" onClick={() => onJump(i)}>
                <span className="stepper__dot" aria-hidden="true">✓</span>
                {step.title}
              </button>
            ) : (
              <span className="stepper__link" aria-current={state === 'current' ? 'step' : undefined}>
                <span className="stepper__dot" aria-hidden="true">{i + 1}</span>
                {step.title}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function DetailsStep({ form, errors, update }) {
  return (
    <>
      <Field label="Full name" error={errors.name}>
        {(p) => <input {...p} value={form.name} onChange={update('name')} autoComplete="name" />}
      </Field>
      <Field label="Mobile number" hint="We will call this number to arrange your verification" error={errors.phone}>
        {(p) => (
          <input
            {...p}
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="077 123 4567"
            autoComplete="tel"
          />
        )}
      </Field>
      <Field label="NIC number" hint="Old (9 digits + V) or new (12 digits) format" error={errors.nic}>
        {(p) => (
          <input
            {...p}
            value={form.nic}
            onChange={update('nic')}
            placeholder="199012345678"
            autoCapitalize="characters"
            className="input--short"
          />
        )}
      </Field>
    </>
  )
}

function WorkStep({ form, errors, update, setValue, services }) {
  return (
    <>
      <ServicePicker services={services} value={form.services} onChange={setValue('services')} error={errors.services} />
      <ExperiencePicker value={form.experienceYears} onChange={setValue('experienceYears')} error={errors.experienceYears} />

      <Field
        label="Tell customers a little about yourself"
        optional
        hint='For example: "I have cleaned homes in Kadawatha for 4 years and I am happy to work weekends."'
        error={errors.bio}
      >
        {(p) => (
          <>
            <textarea {...p} rows="4" maxLength={1000} value={form.bio} onChange={update('bio')} />
            <span className="counter" aria-live="polite">{form.bio.length} / 1000</span>
          </>
        )}
      </Field>
    </>
  )
}

function AreasStep({ form, errors, setValue, provinces, launchDistricts }) {
  return (
    <DistrictPicker
      provinces={provinces}
      launchDistricts={launchDistricts}
      value={form.serviceAreas}
      onChange={setValue('serviceAreas')}
      error={errors.serviceAreas}
    />
  )
}

function LoginStep({ form, errors, update }) {
  return (
    <>
      <p className="note">You will use these to log in and check your application.</p>
      <Field label="Email address" error={errors.email}>
        {(p) => (
          <input {...p} type="email" inputMode="email" value={form.email} onChange={update('email')} autoComplete="email" />
        )}
      </Field>
      <Field label="Create a password" hint="At least 8 characters" error={errors.password}>
        {(p) => <PasswordInput {...p} value={form.password} onChange={update('password')} autoComplete="new-password" />}
      </Field>
    </>
  )
}

function ReviewStep({ form, services, onEdit }) {
  const labelOf = (v) => services.find((s) => s.value === v)?.label ?? v
  const rows = [
    { step: 0, label: 'Name', value: form.name },
    { step: 0, label: 'Mobile', value: normalisePhone(form.phone) },
    { step: 0, label: 'NIC', value: normaliseNic(form.nic) },
    { step: 1, label: 'Work', value: form.services.map(labelOf).join(', ') },
    { step: 1, label: 'Experience', value: experienceLabel(form.experienceYears) },
    { step: 1, label: 'About you', value: form.bio.trim() || 'Not added' },
    { step: 2, label: 'Districts', value: form.serviceAreas.join(', ') },
    { step: 3, label: 'Email', value: form.email.trim() },
  ]

  return (
    <>
      <dl className="review">
        {rows.map((r) => (
          <div key={r.label} className="review__row">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
            <button type="button" className="link-btn" onClick={() => onEdit(r.step)} aria-label={`Change ${r.label}`}>
              Change
            </button>
          </div>
        ))}
      </dl>
      <div className="note">
        <strong>What happens next</strong>
        <ol className="next-list">
          <li>Upload a photo of your NIC and a police clearance report.</li>
          <li>Our team checks your documents and may call you.</li>
          <li>Once approved, you start getting job requests near you.</li>
        </ol>
      </div>
    </>
  )
}

export default function ProviderRegister() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const [options, setOptions] = useState(null)
  const [optionsError, setOptionsError] = useState(null)
  const [form, setForm] = useState(loadDraft)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('/providers/options').then(setOptions).catch((err) => setOptionsError(err.message))
  }, [])

  useEffect(() => saveDraft(form), [form])

  // Move focus to the new step's heading so keyboard and screen-reader users follow along
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  const setValue = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  const goTo = (i) => {
    setErrors({})
    setFormError(null)
    setStep(i)
  }

  function next(e) {
    e.preventDefault()
    const found = validateStep(step, form)
    setErrors(found)
    if (Object.keys(found).length) return
    if (step < STEPS.length - 1) goTo(step + 1)
    else submit()
  }

  async function submit() {
    setSubmitting(true)
    setFormError(null)
    try {
      const { token, user } = await api('/providers/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          phone: normalisePhone(form.phone),
          nic: normaliseNic(form.nic),
          services: form.services,
          experienceYears: form.experienceYears,
          bio: form.bio.trim() || undefined,
          serviceAreas: form.serviceAreas,
          email: form.email.trim(),
          password: form.password,
        },
      })
      clearDraft()
      signIn(token, user)
      navigate('/provider/dashboard', { replace: true, state: { justRegistered: true } })
    } catch (err) {
      // Send the person back to the step with the problem
      const details = { ...err.details }
      if (err.status === 409 && /email/i.test(err.message)) details.email = err.message
      if (err.status === 409 && /nic/i.test(err.message)) details.nic = err.message

      const target = STEPS.findIndex((s) => s.fields.some((f) => details[f]))
      if (target >= 0) {
        setStep(target)
        setErrors(details)
      } else {
        setFormError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const stepProps = {
    form,
    errors,
    update,
    setValue,
    services: options?.services ?? [],
    provinces: options?.provinces ?? [],
    launchDistricts: options?.launchDistricts ?? [],
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="signup">
      <aside className="signup__side">
        <div className="signup__art">
          <SignUpSpot />
        </div>
        <p className="eyebrow">Work with LankaLink</p>
        <h1 className="signup__title">Join as a service provider</h1>
        <p className="muted">Takes about 5 minutes. Your progress is saved on this device if you leave the page.</p>
        <Stepper current={step} onJump={goTo} />
        <div className="side-note">
          <strong>Keep these ready</strong>
          <ul>
            <li>Your NIC</li>
            <li>A police clearance report (you can upload it after signing up)</li>
          </ul>
        </div>
      </aside>

      <section className="signup__main">
        <p className="progress-text">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="progress" aria-hidden="true">
          <div className="progress__bar" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <h2 ref={headingRef} tabIndex={-1} className="step-title">
          {STEPS[step].title}
        </h2>

        {optionsError && (
          <p className="alert alert--error" role="alert">
            We could not load the form. Check your connection and refresh the page.
          </p>
        )}

        <form onSubmit={next} noValidate>
          {step === 0 && <DetailsStep {...stepProps} />}
          {step === 1 && <WorkStep {...stepProps} />}
          {step === 2 && <AreasStep {...stepProps} />}
          {step === 3 && <LoginStep {...stepProps} />}
          {step === 4 && <ReviewStep {...stepProps} onEdit={goTo} />}

          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}

          <div className="actions">
            {step > 0 && (
              <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)} disabled={submitting}>
                Back
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={submitting || !options}>
              {isLast ? (submitting ? 'Sending…' : 'Send my application') : 'Continue'}
            </button>
          </div>
        </form>

        {step === 0 && (
          <p className="muted small">
            Already signed up? <Link to="/login">Log in</Link>
          </p>
        )}
      </section>
    </div>
  )
}
