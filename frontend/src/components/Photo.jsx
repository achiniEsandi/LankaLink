import { useState } from 'react'

// Shows /images/<name>.jpg; until that file exists, a tinted tile with an icon stands in
export default function Photo({ name, alt, icon: Icon, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`photo photo--fallback ${className}`} role="img" aria-label={alt}>
        {Icon && <Icon size={44} strokeWidth={1.5} aria-hidden="true" />}
      </div>
    )
  }
  return (
    <img
      className={`photo ${className}`}
      src={`/images/${name}.jpg`}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
