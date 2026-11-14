import { ArrowLeft, Check, CircleAlert, CircleCheck, Clock, ExternalLink, FileText, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import ReasonDialog from '../../components/admin/ReasonDialog'
import StatusChip from '../../components/admin/StatusChip'
import Avatar from '../../components/provider/Avatar'
import { DAY_LABELS, PERIOD_LABELS } from '../../lib/availability'
import { experienceLabel } from '../../lib/provider'
import useProtectedFile from '../../lib/useProtectedFile'

const DOC_REASONS = ['Photo is blurry', 'Part of the document is cut off', 'Name does not match the profile', 'Wrong document uploaded']
const CHANGE_REASONS = ['Please upload a clearer photo of your NIC', 'Your police report is missing or unreadable']
const SUSPEND_REASONS = ['Repeated customer complaints', 'Did not attend booked jobs', 'Under investigation']

const HISTORY_LABELS = {
  document_approved: 'Approved a document',
  document_rejected: 'Rejected a document',
  approved: 'Approved the provider',
  changes_requested: 'Asked for changes',
  resubmitted: 'Provider uploaded a new document',
  suspended: 'Suspended the provider',
  reactivated: 'Reactivated the provider',
}

const DOC_STATUS = {
  pending: { icon: Clock, label: 'Waiting for review' },
  approved: { icon: CircleCheck, label: 'Approved' },
  rejected: { icon: CircleAlert, label: 'Rejected' },
}

const when = (date) =>
  new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function DocumentReview({ doc, label, token, onApprove, onReject }) {
  const isImage = doc.mimeType.startsWith('image/')
  const url = useProtectedFile(`/admin/documents/${doc._id}/file`, token)
  const status = DOC_STATUS[doc.status]
  const StatusIcon = status.icon

  return (
    <div className={`review-doc review-doc--${doc.status}`}>
      <div className="review-doc__head">
        <p className="review-doc__label">{label}</p>
        <span className={`doc-status doc-status--${doc.status}`}>
          <StatusIcon size={15} aria-hidden="true" /> {status.label}
        </span>
      </div>

      {isImage ? (
        url ? (
          <a href={url} target="_blank" rel="noreferrer" className="review-doc__image" title="Open full size">
            <img src={url} alt={`${label}: ${doc.originalName}`} />
          </a>
        ) : (
          <div className="review-doc__image review-doc__image--loading">Loading…</div>
        )
      ) : (
        <a href={url ?? undefined} target="_blank" rel="noreferrer" className="review-doc__pdf" aria-disabled={!url}>
          <FileText size={28} aria-hidden="true" />
          <span>
            {doc.originalName}
            <small>
              PDF · open to read <ExternalLink size={12} aria-hidden="true" />
            </small>
          </span>
        </a>
      )}

      {doc.status === 'rejected' && doc.rejectionReason && <p className="review-doc__reason">Reason: {doc.rejectionReason}</p>}
      {doc.reviewedAt && (
        <p className="muted small">
          Reviewed {doc.reviewedBy?.name ? `by ${doc.reviewedBy.name} ` : ''}on {when(doc.reviewedAt)}
        </p>
      )}

      <div className="review-doc__actions">
        <button type="button" className="btn btn--small btn--primary" onClick={onApprove} disabled={doc.status === 'approved'}>
          <Check size={15} aria-hidden="true" /> Approve
        </button>
        <button type="button" className="btn btn--small btn--ghost" onClick={onReject} disabled={doc.status === 'rejected'}>
          <X size={15} aria-hidden="true" /> Reject
        </button>
      </div>
    </div>
  )
}

function RemoveDialog({ open, name, onConfirm, onClose }) {
  const ref = useRef(null)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal()
    if (!open && ref.current.open) ref.current.close()
  }, [open])

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="remove-title">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onConfirm()
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <h2 id="remove-title" className="dialog__title">Remove {name}?</h2>
        <p className="muted small">
          This permanently deletes their account, profile, documents and photo. It cannot be undone. To stop them
          getting jobs for now, suspend them instead.
        </p>
        <label className="field">
          <span className="field__label">Type REMOVE to confirm</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </label>
        {error && <p className="field__error">{error}</p>}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--danger btn--small" disabled={typed !== 'REMOVE'}>
            Remove permanently
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default function AdminProviderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [labels, setLabels] = useState({})
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [dialog, setDialog] = useState(null)

  const load = useCallback(
    () =>
      api(`/admin/providers/${id}`, { token })
        .then(setData)
        .catch((err) => setError(err.status === 404 ? 'This provider no longer exists.' : err.message)),
    [id, token],
  )

  useEffect(() => {
    load()
    api('/providers/options')
      .then((o) => setLabels(Object.fromEntries(o.services.map((s) => [s.value, s.label]))))
      .catch(() => {})
  }, [load])

  const photo = useProtectedFile(
    data?.provider.hasPhoto ? `/admin/providers/${id}/photo?v=${data.provider.photo.updatedAt}` : null,
    token,
  )

  if (error) return <p className="alert alert--error">{error}</p>
  if (!data) return <p className="muted">Loading provider…</p>

  const { provider, user, documents, documentTypes, summary, canApprove } = data
  const run = async (fn, message) => {
    setNotice(null)
    try {
      await fn()
      await load()
      setNotice({ tone: 'ok', text: message })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    }
  }

  const reviewDoc = (doc, status, reason) =>
    api(`/admin/documents/${doc._id}`, { method: 'PATCH', token, body: { status, reason } })
  const action = (name, body) => api(`/admin/providers/${id}/${name}`, { method: 'POST', token, body })

  const required = documentTypes.filter((t) => t.required)
  const missingApprovals = required.filter((t) => !documents.some((d) => d.type === t.value && d.status === 'approved'))
  const certificates = documents.filter((d) => d.type === 'certificate')

  return (
    <div className="admin admin-detail">
      <Link to="/admin/providers" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> All providers
      </Link>

      <header className="detail-head">
        <Avatar src={photo} name={user.name} size={72} />
        <div className="detail-head__text">
          <h1>{user.name}</h1>
          <p className="muted">
            Applied {when(provider.createdAt)}
            {provider.approvedAt && provider.status !== 'pending' ? ` · Approved ${when(provider.approvedAt)}` : ''}
          </p>
        </div>
        <StatusChip status={provider.status} />
      </header>

      <div className="detail-actions">
        {['pending', 'rejected'].includes(provider.status) && (
          <>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canApprove}
              onClick={() => run(() => action('approve'), `${user.name} is approved and can now receive jobs.`)}
            >
              <CircleCheck size={17} aria-hidden="true" /> Approve provider
            </button>
            {provider.status === 'pending' && (
              <button type="button" className="btn btn--ghost" onClick={() => setDialog('changes')}>
                Ask for changes
              </button>
            )}
          </>
        )}
        {provider.status === 'approved' && (
          <>
            <Link to={`/providers/${provider._id}`} className="btn btn--ghost">
              View public profile
            </Link>
            <button type="button" className="btn btn--ghost" onClick={() => setDialog('suspend')}>
              Suspend
            </button>
          </>
        )}
        {provider.status === 'suspended' && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => run(() => action('reactivate'), `${user.name} is active again.`)}
          >
            Reactivate
          </button>
        )}
        <button type="button" className="btn btn--danger-ghost" onClick={() => setDialog('remove')}>
          Remove
        </button>
      </div>

      {['pending', 'rejected'].includes(provider.status) && !canApprove && (
        <p className="muted small">
          Before approving:{' '}
          {[
            missingApprovals.length && `approve ${missingApprovals.map((t) => t.label).join(', ')}`,
            !user.emailVerified && 'the provider must confirm their email address',
          ]
            .filter(Boolean)
            .join('; ')}
          .
        </p>
      )}

      {notice && (
        <p className={notice.tone === 'ok' ? 'success-banner success-banner--slim' : 'alert alert--error'} role="status">
          {notice.text}
        </p>
      )}

      {provider.rejectionReason && ['rejected', 'suspended'].includes(provider.status) && (
        <div className="alert alert--error">
          <strong>{provider.status === 'suspended' ? 'Suspended' : 'Changes requested'}</strong>
          <p>{provider.rejectionReason}</p>
        </div>
      )}

      <div className="detail-grid">
        <section className="panel">
          <div className="panel__title-row">
            <h2 className="panel__title">Documents</h2>
            <span className="muted small">
              {summary.approved} of {summary.required} required approved
            </span>
          </div>

          <div className="review-docs">
            {required.map((t) => {
              const doc = documents.find((d) => d.type === t.value)
              return doc ? (
                <DocumentReview
                  key={t.value}
                  doc={doc}
                  label={t.label}
                  token={token}
                  onApprove={() => run(() => reviewDoc(doc, 'approved'), `${t.label} approved.`)}
                  onReject={() => setDialog({ doc, label: t.label })}
                />
              ) : (
                <div key={t.value} className="review-doc review-doc--missing">
                  <p className="review-doc__label">{t.label}</p>
                  <p className="muted small">Not uploaded yet.</p>
                </div>
              )
            })}
            {certificates.map((doc, i) => (
              <DocumentReview
                key={doc._id}
                doc={doc}
                label={`Certificate ${i + 1} (optional)`}
                token={token}
                onApprove={() => run(() => reviewDoc(doc, 'approved'), 'Certificate approved.')}
                onReject={() => setDialog({ doc, label: 'Certificate' })}
              />
            ))}
          </div>
        </section>

        <div className="detail-side">
          <section className="panel">
            <h2 className="panel__title">Details</h2>
            <dl className="profile">
              <dt>NIC</dt>
              <dd className="mono">{provider.nic}</dd>
              <dt>Mobile</dt>
              <dd>
                <a href={`tel:${user.phone}`}>{user.phone}</a>
              </dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${user.email}`}>{user.email}</a>
                <span className={`email-state email-state--${user.emailVerified ? 'ok' : 'no'}`}>
                  {user.emailVerified ? 'Confirmed' : 'Not confirmed yet'}
                </span>
              </dd>
              <dt>Work</dt>
              <dd>{provider.services.map((s) => labels[s] ?? s).join(', ')}</dd>
              <dt>Experience</dt>
              <dd>{experienceLabel(provider.experienceYears)}</dd>
              <dt>Districts</dt>
              <dd>{provider.serviceAreas.join(', ')}</dd>
              <dt>Available</dt>
              <dd>
                {provider.availability?.length
                  ? provider.availability.map((a) => `${DAY_LABELS[a.day].slice(0, 3)} ${a.periods.map((p) => PERIOD_LABELS[p].toLowerCase()).join(', ')}`).join(' · ')
                  : 'Not set'}
              </dd>
            </dl>
            {provider.bio && <p className="detail-bio">“{provider.bio}”</p>}
          </section>

          <section className="panel">
            <h2 className="panel__title">History</h2>
            {provider.history.length === 0 ? (
              <p className="muted small">No decisions yet.</p>
            ) : (
              <ol className="history">
                {[...provider.history].reverse().map((h, i) => (
                  <li key={i}>
                    <p className="history__action">
                      {HISTORY_LABELS[h.action] ?? h.action}
                      {h.by?.name && <span className="muted"> · {h.by.name}</span>}
                    </p>
                    {h.reason && <p className="history__reason">{h.reason}</p>}
                    <p className="muted small">{when(h.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <ReasonDialog
        open={Boolean(dialog?.doc)}
        title={`Reject ${dialog?.label ?? 'document'}`}
        description="The provider sees this reason next to the document and can upload a new one."
        suggestions={DOC_REASONS}
        confirmLabel="Reject document"
        danger
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await reviewDoc(dialog.doc, 'rejected', reason)
          setDialog(null)
          await load()
          setNotice({ tone: 'ok', text: `${dialog.label} rejected. The provider will see your reason.` })
        }}
      />
      <ReasonDialog
        open={dialog === 'changes'}
        title="Ask for changes"
        description="The application goes back to the provider. It returns to the review queue when they upload a new document."
        suggestions={CHANGE_REASONS}
        confirmLabel="Send back to provider"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await action('reject', { reason })
          setDialog(null)
          await load()
          setNotice({ tone: 'ok', text: 'Sent back to the provider with your note.' })
        }}
      />
      <ReasonDialog
        open={dialog === 'suspend'}
        title={`Suspend ${user.name}`}
        description="They stop receiving jobs and disappear from search until you reactivate them."
        suggestions={SUSPEND_REASONS}
        confirmLabel="Suspend provider"
        danger
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await action('suspend', { reason })
          setDialog(null)
          await load()
          setNotice({ tone: 'ok', text: `${user.name} is suspended.` })
        }}
      />
      <RemoveDialog
        open={dialog === 'remove'}
        name={user.name}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await api(`/admin/providers/${id}`, { method: 'DELETE', token, body: { confirm: 'REMOVE' } })
          navigate('/admin/providers', { replace: true })
        }}
      />
    </div>
  )
}
