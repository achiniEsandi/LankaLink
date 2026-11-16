import { ArrowLeft, Camera, CircleCheck, Eye, Lock, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api, uploadFile } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import Avatar from '../components/provider/Avatar'
import { AvailabilityPicker, DistrictPicker, ExperiencePicker, ServicePicker } from '../components/provider/Pickers'
import PublicProfileCard from '../components/provider/PublicProfileCard'
import { EXPERIENCE_OPTIONS, normaliseNic, normalisePhone } from '../lib/provider'
import useMyPhoto from '../lib/useMyPhoto'

const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const NIC_PATTERN = /^(\d{9}[VX]|\d{12})$/
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// Stored years -> the range option the pickers show
const experienceOption = (years) => [...EXPERIENCE_OPTIONS].reverse().find((o) => years >= o.value)?.value ?? 0

function formFrom({ user, provider }) {
  return {
    name: user.name,
    nic: provider.nic,
    phone: user.phone,
    services: provider.services,
    experienceYears: experienceOption(provider.experienceYears),
    bio: provider.bio ?? '',
    serviceAreas: provider.serviceAreas,
    availability: provider.availability ?? [],
  }
}

function validate(form, identityLocked) {
  const errors = {}
  if (!identityLocked) {
    if (!form.name.trim()) errors.name = 'Enter your name as it appears on your NIC'
    if (!NIC_PATTERN.test(normaliseNic(form.nic))) errors.nic = 'Enter 12 digits, or 9 digits followed by V or X'
  }
  if (!PHONE_PATTERN.test(normalisePhone(form.phone))) errors.phone = 'Enter a mobile number like 077 123 4567'
  if (!form.services.length) errors.services = 'Choose at least one type of work'
  if (!form.serviceAreas.length) errors.serviceAreas = 'Choose at least one district'
  return errors
}

function PhotoSection({ token, provider, name, onChanged }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const photoUrl = useMyPhoto(token, provider.hasPhoto ? provider.photo.updatedAt : null)

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) return setError('Choose a photo (JPG, PNG or WEBP).')
    if (file.size > MAX_PHOTO_BYTES) return setError('That photo is larger than 5 MB. Try a smaller one.')
    setError(null)
    setBusy(true)
    try {
      const { provider: updated } = await uploadFile('/providers/me/photo', { token, file })
      onChanged(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove your profile photo?')) return
    setBusy(true)
    try {
      await api('/providers/me/photo', { method: 'DELETE', token })
      onChanged({ ...provider, hasPhoto: false, photo: undefined })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="edit-section" aria-labelledby="photo-title">
      <h2 id="photo-title">Profile photo</h2>
      <div className="photo-row">
        <Avatar src={photoUrl} name={name} size={88} />
        <div>
          <p className="muted small">
            A clear photo of your face, without sunglasses or a hat. Customers are more likely to choose a provider
            they can see.
          </p>
          <div className="photo-actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={() => inputRef.current.click()} disabled={busy}>
              <Camera size={16} aria-hidden="true" /> {provider.hasPhoto ? 'Change photo' : 'Add a photo'}
            </button>
            {provider.hasPhoto && (
              <button type="button" className="link-btn" onClick={remove} disabled={busy}>
                <Trash2 size={14} aria-hidden="true" /> Remove
              </button>
            )}
            {busy && <span className="muted small">Uploading…</span>}
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
        </div>
      </div>
    </section>
  )
}

export default function ProviderProfileEdit() {
  const { token, signIn } = useAuth()
  const [data, setData] = useState(null)
  const [options, setOptions] = useState(null)
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [status, setStatus] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const previewPhoto = useMyPhoto(token, data?.provider.hasPhoto ? data.provider.photo.updatedAt : null)

  useEffect(() => {
    api('/providers/me', { token })
      .then((d) => {
        setData(d)
        setForm(formFrom(d))
        setSaved(formFrom(d))
      })
      .catch((err) => setFormError(err.message))
    api('/providers/options').then(setOptions).catch((err) => setFormError(err.message))
  }, [token])

  const dirty = form && saved && JSON.stringify(form) !== JSON.stringify(saved)

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Let the "Profile saved" confirmation fade after a few seconds
  useEffect(() => {
    if (status !== 'saved') return undefined
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  if (formError && !data) return <p className="alert alert--error">{formError}</p>
  if (!data || !options || !form) return <p className="muted">Loading your profile…</p>

  const { identityLocked } = data
  const setValue = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setStatus(null)
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }
  const update = (field) => (e) => setValue(field)(e.target.value)

  async function save(e) {
    e.preventDefault()
    const found = validate(form, identityLocked)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted items.')
      return
    }
    setStatus('saving')
    try {
      const result = await api('/providers/me', {
        method: 'PATCH',
        token,
        body: {
          ...(identityLocked ? {} : { name: form.name.trim(), nic: normaliseNic(form.nic) }),
          phone: normalisePhone(form.phone),
          services: form.services,
          experienceYears: form.experienceYears,
          bio: form.bio,
          serviceAreas: form.serviceAreas,
          availability: form.availability,
        },
      })
      setData(result)
      setForm(formFrom(result))
      setSaved(formFrom(result))
      signIn(token, result.user)
      setStatus('saved')
    } catch (err) {
      setErrors(err.details || {})
      setFormError(err.message)
      setStatus(null)
    }
  }

  const labels = Object.fromEntries(options.services.map((s) => [s.value, s.label]))
  const previewProfile = {
    name: form.name.split(/\s+/).length > 1 ? `${form.name.split(/\s+/)[0]} ${form.name.trim().split(/\s+/).at(-1)[0]}.` : form.name,
    services: form.services,
    serviceAreas: form.serviceAreas,
    experienceYears: form.experienceYears,
    bio: form.bio.trim(),
    availability: form.availability,
    verified: data.provider.status === 'approved',
    memberSince: data.user.createdAt,
    reviewCount: 0,
  }

  return (
    <div className="profile-edit">
      <Link to="/provider/dashboard" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to my account
      </Link>
      <div className="profile-edit__head">
        <div>
          <h1>Your profile</h1>
          <p className="muted">This is what customers see when choosing who to book. Keep it up to date.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setShowPreview((v) => !v)}>
          <Eye size={16} aria-hidden="true" /> {showPreview ? 'Back to editing' : 'See what customers see'}
        </button>
      </div>

      {showPreview ? (
        <div className="preview-frame">
          <p className="preview-frame__label">Preview{dirty ? ', including unsaved changes' : ''}</p>
          <PublicProfileCard profile={previewProfile} photoUrl={previewPhoto} serviceLabels={labels} preview />
          {data.provider.status !== 'approved' && (
            <p className="muted small">Customers can find your profile once your documents are approved.</p>
          )}
        </div>
      ) : (
        <form onSubmit={save} noValidate>
          <PhotoSection
            token={token}
            provider={data.provider}
            name={form.name}
            onChanged={(provider) => setData((d) => ({ ...d, provider }))}
          />

          <section className="edit-section" aria-labelledby="details-title">
            <h2 id="details-title">Your details</h2>
            {identityLocked && (
              <p className="note note--quiet">
                <Lock size={15} aria-hidden="true" /> Your name and NIC are verified, so they can only be changed by
                calling us on 070 267 8393.
              </p>
            )}
            <div className="grid-2">
              <Field label="Full name" error={errors.name}>
                {(p) => <input {...p} value={form.name} onChange={update('name')} disabled={identityLocked} autoComplete="name" />}
              </Field>
              <Field label="NIC number" error={errors.nic}>
                {(p) => <input {...p} value={form.nic} onChange={update('nic')} disabled={identityLocked} />}
              </Field>
              <Field label="Mobile number" hint="Customers never see this number" error={errors.phone}>
                {(p) => <input {...p} type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" />}
              </Field>
              <Field label="Email address" hint="Used to log in">
                {(p) => <input {...p} value={data.user.email} disabled />}
              </Field>
            </div>
          </section>

          <section className="edit-section" aria-labelledby="work-title">
            <h2 id="work-title">Your work</h2>
            <ServicePicker services={options.services} value={form.services} onChange={setValue('services')} error={errors.services} />
            <ExperiencePicker value={form.experienceYears} onChange={setValue('experienceYears')} />
            <Field label="About you" optional hint="Customers read this before booking. Mention your experience and the areas you know well." error={errors.bio}>
              {(p) => (
                <>
                  <textarea {...p} rows="4" maxLength={1000} value={form.bio} onChange={update('bio')} />
                  <span className="counter">{form.bio.length} / 1000</span>
                </>
              )}
            </Field>
          </section>

          <section className="edit-section" aria-labelledby="areas-title">
            <h2 id="areas-title">Where you work</h2>
            <DistrictPicker
              provinces={options.provinces}
              launchDistricts={options.launchDistricts}
              value={form.serviceAreas}
              onChange={setValue('serviceAreas')}
              error={errors.serviceAreas}
            />
          </section>

          <section className="edit-section" aria-labelledby="avail-title">
            <h2 id="avail-title">Availability</h2>
            <AvailabilityPicker
              days={options.days}
              periods={options.periods}
              value={form.availability}
              onChange={setValue('availability')}
              error={errors.availability}
            />
          </section>

          <div className={`save-bar${dirty || status ? ' save-bar--visible' : ''}`}>
            <div className="save-bar__inner">
              <span className="save-bar__text" role="status">
                {status === 'saved' && !dirty ? (
                  <>
                    <CircleCheck size={16} aria-hidden="true" /> Profile saved
                  </>
                ) : formError ? (
                  <span className="save-bar__error">{formError}</span>
                ) : dirty ? (
                  'You have unsaved changes'
                ) : null}
              </span>
              <div className="save-bar__actions">
                {dirty && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => {
                      setForm(saved)
                      setErrors({})
                      setFormError(null)
                    }}
                  >
                    Undo changes
                  </button>
                )}
                <button type="submit" className="btn btn--primary btn--small" disabled={!dirty || status === 'saving'}>
                  {status === 'saving' ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
