import { useEffect, useState } from 'react'
import { fetchFile } from '../api/client'

// The provider's own photo needs the auth header, so it is loaded as a blob URL.
// `version` changes whenever a new photo is uploaded, which reloads it.
export default function useMyPhoto(token, version) {
  const [loaded, setLoaded] = useState({ version: null, url: null })

  useEffect(() => {
    if (!version) return undefined
    let objectUrl
    let cancelled = false
    fetchFile('/providers/me/photo', { token })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ version, url: objectUrl })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [token, version])

  // A stale URL from a previous photo (or a removed one) is never shown
  return version && loaded.version === version ? loaded.url : null
}
