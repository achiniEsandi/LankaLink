import { useEffect, useState } from 'react'
import { fetchFile } from '../api/client'

// Files behind login need the auth header, so they are loaded as blob URLs.
// Pass a null path to load nothing; a new path (e.g. with a version) reloads.
export default function useProtectedFile(path, token) {
  const [loaded, setLoaded] = useState({ path: null, url: null })

  useEffect(() => {
    if (!path) return undefined
    let objectUrl
    let cancelled = false
    fetchFile(path, { token })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ path, url: objectUrl })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path, token])

  // Never show a stale file from a previous path
  return path && loaded.path === path ? loaded.url : null
}
