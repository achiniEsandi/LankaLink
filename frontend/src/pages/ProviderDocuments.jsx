import { ArrowLeft, Award, Camera, CircleAlert, CircleCheck, Clock, FileText, IdCard, Lock, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api, fetchFile, uploadFile } from '../api/client'
import { useAuth } from '../auth/useAuth'

const GUIDANCE = {
  nic_front: { icon: IdCard, text: 'The side with your photo. Make sure all four corners are in the picture and the text is easy to read.' },
  nic_back: { icon: IdCard, text: 'The side with your address. Same as the front: flat, well lit, no glare.' },
  police_report: { icon: FileText, text: 'Your police clearance report. A clear photo, or a PDF scan if you have one.' },
  certificate: { icon: Award, text: 'Training or trade certificates help customers choose you. You can add up to 5.' },
}

const STATUS = {
  pending: { icon: Clock, label: 'Waiting for review', tone: 'pending' },
  approved: { icon: CircleCheck, label: 'Approved', tone: 'approved' },
  rejected: { icon: CircleAlert, label: 'Needs a new upload', tone: 'rejected' },
}

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`)

function checkFile(file, limits) {
  if (!limits.allowedTypes.includes(file.type)) return 'Choose a photo (JPG, PNG or WEBP) or a PDF.'
  if (file.size > limits.maxBytes) {
    return `This file is ${formatSize(file.size)}. The limit is ${formatSize(limits.maxBytes)}, so try a smaller photo.`
  }
  return null
}

function Preview({ doc, token }) {
  const [url, setUrl] = useState(null)
  const isImage = doc.mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return undefined
    let objectUrl
    let cancelled = false
    fetchFile(`/providers/me/documents/${doc._id}/file`, { token })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc._id, isImage, token])

  if (isImage && url) return <img className="doc-preview" src={url} alt={`Preview of ${doc.originalName}`} />
  return (
    <span className="doc-preview doc-preview--file" aria-hidden="true">
      <FileText size={28} />
    </span>
  )
}

function FilePicker({ label, onPick, disabled }) {
  const inputRef = useRef(null)
  const cameraRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const pick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onPick(file)
  }

  return (
    <div
      className={`dropzone${dragging ? ' dropzone--over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && !disabled) onPick(file)
      }}
    >
      <div className="dropzone__buttons">
        <button type="button" className="btn btn--primary btn--small" onClick={() => inputRef.current.click()} disabled={disabled}>
          <Upload size={16} aria-hidden="true" /> {label}
        </button>
        <button type="button" className="btn btn--ghost btn--small only-touch" onClick={() => cameraRef.current.click()} disabled={disabled}>
          <Camera size={16} aria-hidden="true" /> Take a photo
        </button>
      </div>
      <p className="dropzone__hint">or drag a file here · JPG, PNG, WEBP or PDF, up to 5 MB</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={pick} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
    </div>
  )
}

function UploadedFile({ doc, token, onReplace, onRemove, busy }) {
  const status = STATUS[doc.status]
  const StatusIcon = status.icon
  const locked = doc.status === 'approved'

  return (
    <div className="doc-file">
      <Preview doc={doc} token={token} />
      <div className="doc-file__info">
        <p className="doc-file__name" title={doc.originalName}>{doc.originalName}</p>
        <p className="doc-file__meta">{formatSize(doc.size)}</p>
        <p className={`doc-status doc-status--${status.tone}`}>
          <StatusIcon size={15} aria-hidden="true" /> {status.label}
        </p>
        {doc.status === 'rejected' && doc.rejectionReason && <p className="doc-file__reason">{doc.rejectionReason}</p>}
      </div>
      {!locked && (
        <div className="doc-file__actions">
          {onReplace && (
            <label className={`link-btn${busy ? ' is-disabled' : ''}`}>
              Replace
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) onReplace(file)
                }}
              />
            </label>
          )}
          <button type="button" className="icon-btn" onClick={onRemove} disabled={busy} aria-label={`Remove ${doc.originalName}`}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentCard({ type, docs, limits, token, onChanged }) {
  const guide = GUIDANCE[type.value]
  const Icon = guide.icon
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const busy = progress !== null
  const atLimit = type.multiple && docs.length >= 5

  async function send(file) {
    const problem = checkFile(file, limits)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setProgress(0)
    try {
      await uploadFile('/providers/me/documents', { token, fields: { type: type.value }, file, onProgress: setProgress })
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setProgress(null)
    }
  }

  async function remove(doc) {
    if (!window.confirm(`Remove ${doc.originalName}?`)) return
    setError(null)
    try {
      await api(`/providers/me/documents/${doc._id}`, { method: 'DELETE', token })
      await onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  const showPicker = type.multiple ? !atLimit : docs.length === 0

  return (
    <section className="doc-card" aria-labelledby={`doc-${type.value}`}>
      <header className="doc-card__head">
        <span className="doc-card__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <div>
          <h2 id={`doc-${type.value}`} className="doc-card__title">
            {type.label}
            <span className={type.required ? 'tag' : 'tag tag--quiet'}>{type.required ? 'Required' : 'Optional'}</span>
          </h2>
          <p className="doc-card__text">{guide.text}</p>
        </div>
      </header>

      {docs.map((doc) => (
        <UploadedFile
          key={doc._id}
          doc={doc}
          token={token}
          busy={busy}
          onReplace={type.multiple ? null : send}
          onRemove={() => remove(doc)}
        />
      ))}

      {busy && (
        <div className="upload-progress" role="status">
          <span>Uploading… {Math.round(progress * 100)}%</span>
          <div className="progress progress--always" aria-hidden="true">
            <div className="progress__bar" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {showPicker && !busy && (
        <FilePicker label={type.multiple && docs.length ? 'Add another' : 'Choose a file'} onPick={send} disabled={busy} />
      )}

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default function ProviderDocuments() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(
    () =>
      api('/providers/me/documents', { token })
        .then(setData)
        .catch((err) => setError(err.message)),
    [token],
  )

  useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading your documents…</p>

  const required = data.types.filter((t) => t.required)
  const doneCount = required.length - data.missing.length
  const limits = { maxBytes: data.maxBytes, allowedTypes: data.allowedTypes }

  return (
    <div className="documents">
      <Link to="/provider/dashboard" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to my account
      </Link>

      <header className="documents__head">
        <h1>Upload your documents</h1>
        <p className="lead">We check these before you visit anyone's home. It keeps customers safe and helps them trust you.</p>
        <p className="privacy-note">
          <Lock size={15} aria-hidden="true" /> Only the LankaLink verification team can see your documents.
        </p>
      </header>

      {data.complete ? (
        <div className="success-banner" role="status">
          <CircleCheck size={22} aria-hidden="true" />
          <div>
            <strong>All required documents are uploaded</strong>
            <p>We will review them within 2 working days and may call you. You can still add certificates.</p>
          </div>
        </div>
      ) : (
        <div className="doc-progress">
          <p>
            <strong>{doneCount} of {required.length}</strong> required documents uploaded
          </p>
          <div className="progress progress--always" aria-hidden="true">
            <div className="progress__bar" style={{ width: `${(doneCount / required.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="doc-grid">
        {data.types.map((type) => (
          <DocumentCard
            key={type.value}
            type={type}
            docs={data.documents.filter((d) => d.type === type.value)}
            limits={limits}
            token={token}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  )
}
