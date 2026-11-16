import { useId } from 'react'

// Label + input + hint/error, wired up for screen readers
export default function Field({ label, hint, error, optional, children }) {
  const id = useId()
  const messageId = `${id}-msg`
  const message = error || hint

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': message ? messageId : undefined })}
      {message && (
        <p id={messageId} className={error ? 'field__error' : 'field__hint'}>
          {message}
        </p>
      )}
    </div>
  )
}
