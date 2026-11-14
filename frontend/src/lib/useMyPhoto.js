import useProtectedFile from './useProtectedFile'

// The provider's own photo; `version` changes whenever a new photo is uploaded
export default function useMyPhoto(token, version) {
  return useProtectedFile(version ? `/providers/me/photo?v=${encodeURIComponent(version)}` : null, token)
}
