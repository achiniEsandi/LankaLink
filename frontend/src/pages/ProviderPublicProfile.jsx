import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../api/client'
import PublicProfileCard from '../components/provider/PublicProfileCard'

// Public page customers open from search results
export default function ProviderPublicProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [labels, setLabels] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    api(`/providers/${id}/public`)
      .then((d) => setProfile(d.profile))
      .catch((err) => setError(err.status === 404 ? 'This provider is not available.' : err.message))
    api('/providers/options')
      .then((o) => setLabels(Object.fromEntries(o.services.map((s) => [s.value, s.label]))))
      .catch(() => {})
  }, [id])

  if (error) return <p className="alert alert--error">{error}</p>
  if (!profile) return <p className="muted">Loading…</p>

  const photoUrl = profile.hasPhoto ? `/api/providers/${profile._id}/photo?v=${profile.photoVersion}` : null
  return (
    <div className="profile-page">
      <PublicProfileCard profile={profile} photoUrl={photoUrl} serviceLabels={labels} />
    </div>
  )
}
