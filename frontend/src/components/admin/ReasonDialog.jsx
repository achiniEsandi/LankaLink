import { useEffect, useRef, useState } from 'react'

// Modal that collects a short reason, with one-tap suggestions
export default function ReasonDialog({ open, title, description, suggestions = [], confirmLabel, danger, onConfirm, onClose }) {
  const ref = useRef(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function submit(e) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Write a short reason. The provider will see it.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
      setReason('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="reason-title">
      <form onSubmit={submit}>
        <h2 id="reason-title" className="dialog__title">{title}</h2>
        {description && <p className="muted small">{description}</p>}
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" className="suggestion" onClick={() => setReason(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <label className="field">
          <span className="field__label">Reason</span>
          <textarea rows="3" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </label>
        {error && <p className="field__error" role="alert">{error}</p>}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn--small ${danger ? 'btn--danger' : 'btn--primary'}`} disabled={busy}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
