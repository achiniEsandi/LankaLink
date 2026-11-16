import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { formatPoint, inSriLanka, parseCoordinates, useOptions } from '../lib/customer'

const EMPTY_FORM = { label: '', type: '', address: '', district: '', gps: '', accessNotes: '' }

function validate(form) {
  const errors = {}
  if (!form.label.trim()) errors.label = 'Give the property a name, e.g. "Mum\'s house"'
  if (!form.type) errors.type = 'Choose a property type'
  if (!form.address.trim()) errors.address = 'Enter the address'
  if (!form.district) errors.district = 'Choose a district'
  if (form.gps.trim()) {
    const point = parseCoordinates(form.gps)
    if (!point) errors.gps = 'Paste the numbers from Google Maps, like 6.9271, 79.8612'
    else if (!inSriLanka(point)) errors.gps = 'That location is outside Sri Lanka. Check the numbers are in the right order.'
  }
  return errors
}

export default function PropertyForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { token } = useAuth()
  const { data: options } = useOptions('/customers/options')
  const [form, setForm] = useState(isNew ? EMPTY_FORM : null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isNew) return
    api(`/customers/me/properties/${id}`, { token })
      .then((p) =>
        setForm({
          label: p.label,
          type: p.type,
          address: p.address,
          district: p.district,
          gps: formatPoint(p.location),
          accessNotes: p.accessNotes ?? '',
        }),
      )
      .catch((err) => setFormError(err.message))
  }, [id, isNew, token])

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
      await api(isNew ? '/customers/me/properties' : `/customers/me/properties/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        token,
        body: {
          label: form.label.trim(),
          type: form.type,
          address: form.address.trim(),
          district: form.district,
          location: parseCoordinates(form.gps),
          accessNotes: form.accessNotes.trim(),
        },
      })
      navigate('/customer/dashboard')
    } catch (err) {
      if (err.details) setErrors({ ...err.details, gps: err.details.location ?? err.details['location.coordinates'] })
      else setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!form) {
    return formError ? <p className="alert alert--error">{formError}</p> : <p className="muted">Loading…</p>
  }

  return (
    <div className="page-form">
      <Link to="/customer/dashboard" className="back-link">
        ← Back to my account
      </Link>
      <h1>{isNew ? 'Add a property' : 'Edit property'}</h1>
      <p className="muted">Tell us about the place you want looked after. Only providers you book will see these details.</p>

      <form onSubmit={handleSubmit} noValidate className="panel">
        <Field label="Name for this property" hint='Something you will recognise, e.g. "Mum&apos;s house" or "Kandy land"' error={errors.label}>
          {(p) => <input {...p} value={form.label} onChange={update('label')} maxLength={80} />}
        </Field>

        <Field label="Type" error={errors.type}>
          {(p) => (
            <select {...p} value={form.type} onChange={update('type')} className="input--short">
              <option value="">Choose a type</option>
              {options?.propertyTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Address" error={errors.address}>
          {(p) => <textarea {...p} rows="2" value={form.address} onChange={update('address')} maxLength={300} autoComplete="street-address" />}
        </Field>

        <Field label="District" error={errors.district}>
          {(p) => (
            <select {...p} value={form.district} onChange={update('district')} className="input--short">
              <option value="">Choose a district</option>
              {options?.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="GPS location"
          optional
          hint="Open Google Maps, press and hold on the house, then copy the numbers that appear (or paste the link). Providers check in against this point."
          error={errors.gps}
        >
          {(p) => <input {...p} value={form.gps} onChange={update('gps')} placeholder="6.9271, 79.8612" className="input--short" />}
        </Field>

        <Field
          label="Access notes"
          optional
          hint="Who has the key, gate codes, dogs on the property, anything the provider should know"
          error={errors.accessNotes}
        >
          {(p) => (
            <>
              <textarea {...p} rows="3" maxLength={1000} value={form.accessNotes} onChange={update('accessNotes')} />
              <span className="counter">{form.accessNotes.length} / 1000</span>
            </>
          )}
        </Field>

        {formError && (
          <p className="alert alert--error" role="alert">
            {formError}
          </p>
        )}

        <div className="actions">
          <Link to="/customer/dashboard" className="btn btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn--primary" disabled={submitting || !options}>
            {submitting ? 'Saving…' : isNew ? 'Add property' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
