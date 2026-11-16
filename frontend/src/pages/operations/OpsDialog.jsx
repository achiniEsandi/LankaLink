import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// Native modal dialog in the site's dialog style
export default function OpsDialog({ open, title, onClose, wide, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={`dialog${wide ? ' dialog--wide' : ''}`} onClose={onClose} aria-label={title}>
      <div className="ops-dialog__head">
        <h2 className="dialog__title">{title}</h2>
        <button type="button" className="icon-link" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
