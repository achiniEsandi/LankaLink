import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'
import { useOptions } from '../lib/customer'

const EMPTY_FORM = {
  name: '',
  relationship: '',
  age: '',
  phone: '',
  address: '',
  district: '',
  careNotes: '',
  contactName: '',
  contactPhone: '',
  contactRelationship: '',
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter their name'
  if (!form.relationship) errors.relationship = 'Choose how they are related to you'
  if (form.age !== '' && !(Number.isInteger(Number(form.age)) && form.age >= 0 && form.age <= 120)) {
    errors.age = 'Enter an age between 0 and 120'
  }
  if (!form.address.trim()) errors.address = 'Enter the address where they live'
  if (!form.district) errors.district = 'Choose a district'
  return errors
}

export default function FamilyMemberForm() {
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
    api(`/customers/me/family/${id}`, { token })
      .then((m) =>
        setForm({
          name: m.name,
          relationship: m.relationship,
          age: m.age ?? '',
          phone: m.phone ?? '',
          address: m.address,
          district: m.district,
          careNotes: m.careNotes ?? '',
          contactName: m.emergencyContact?.name ?? '',
          contactPhone: m.emergencyContact?.phone ?? '',
          contactRelationship: m.emergencyContact?.relationship ?? '',
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
      await api(isNew ? '/customers/me/family' : `/customers/me/family/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        token,
        body: {
          name: form.name.trim(),
          relationship: form.relationship,
          age: form.age === '' ? '' : Number(form.age),
          phone: form.phone.trim(),
          address: form.address.trim(),
          district: form.district,
          careNotes: form.careNotes.trim(),
          emergencyContact: {
            name: form.contactName.trim(),
            phone: form.contactPhone.trim(),
            relationship: form.contactRelationship.trim(),
          },
        },
      })
      navigate('/customer/dashboard')
    } catch (err) {
      if (err.details) setErrors(err.details)
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
      <h1>{isNew ? 'Add a family member' : 'Edit family member'}</h1>
      <p className="muted">
        For welfare visits and errands. Only the provider you book will see these details. Visits are companionship
        and practical help, not medical care.
      </p>

      <form onSubmit={handleSubmit} noValidate className="panel">
        <Field label="Their name" error={errors.name}>
          {(p) => <input {...p} value={form.name} onChange={update('name')} maxLength={100} />}
        </Field>

        <div className="field-row">
          <Field label="Relationship to you" error={errors.relationship}>
            {(p) => (
              <select {...p} value={form.relationship} onChange={update('relationship')}>
                <option value="">Choose</option>
                {options?.relationships.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Age" optional error={errors.age}>
            {(p) => <input {...p} type="number" inputMode="numeric" min="0" max="120" value={form.age} onChange={update('age')} />}
          </Field>
        </div>

        <Field label="Their phone number" optional hint="So the provider can call before arriving" error={errors.phone}>
          {(p) => <input {...p} type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} placeholder="077 123 4567" className="input--short" />}
        </Field>

        <Field label="Address" error={errors.address}>
          {(p) => <textarea {...p} rows="2" value={form.address} onChange={update('address')} maxLength={300} />}
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
          label="Care notes"
          optional
          hint="Health conditions to be aware of, routines, what they enjoy talking about, anything to avoid"
          error={errors.careNotes}
        >
          {(p) => (
            <>
              <textarea {...p} rows="4" maxLength={2000} value={form.careNotes} onChange={update('careNotes')} />
              <span className="counter">{form.careNotes.length} / 2000</span>
            </>
          )}
        </Field>

        <fieldset className="group">
          <legend className="group__label">Emergency contact in Sri Lanka (optional)</legend>
          <p className="group__hint">A neighbour or relative nearby we can call if something is wrong during a visit.</p>
          <div className="field-row field-row--3">
            <Field label="Name">
              {(p) => <input {...p} value={form.contactName} onChange={update('contactName')} maxLength={100} />}
            </Field>
            <Field label="Phone">
              {(p) => <input {...p} type="tel" inputMode="tel" value={form.contactPhone} onChange={update('contactPhone')} />}
            </Field>
            <Field label="Who they are">
              {(p) => <input {...p} value={form.contactRelationship} onChange={update('contactRelationship')} placeholder="Neighbour" maxLength={60} />}
            </Field>
          </div>
        </fieldset>

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
            {submitting ? 'Saving…' : isNew ? 'Add family member' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
