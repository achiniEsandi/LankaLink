import { useState } from 'react'

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
