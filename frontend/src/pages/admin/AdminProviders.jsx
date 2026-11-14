import { ChevronRight, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import StatusChip from '../../components/admin/StatusChip'
import Avatar from '../../components/provider/Avatar'
import useProtectedFile from '../../lib/useProtectedFile'

const TABS = [
  { value: 'pending', label: 'Waiting for review' },
  { value: 'rejected', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'all', label: 'All' },
]

const joined = (date) => {
  const days = Math.floor((Date.now() - new Date(date)) / 864e5)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProviderRow({ p, token, labels }) {
  const photo = useProtectedFile(p.hasPhoto ? `/admin/providers/${p._id}/photo?v=${p.photoVersion}` : null, token)
  const d = p.documents
  return (
    <li>
      <Link to={`/admin/providers/${p._id}`} className="admin-row">
        <Avatar src={photo} name={p.name} size={44} />
        <div className="admin-row__main">
          <p className="admin-row__name">
            {p.name}
            {p.readyForReview && <span className="tag">Ready to review</span>}
          </p>
          <p className="admin-row__meta">
            {p.email} · NIC {p.nic}
          </p>
          <p className="admin-row__meta">
            {p.services.map((s) => labels[s] ?? s).join(', ')} · {p.serviceAreas.join(', ')}
          </p>
        </div>
        <div className="admin-row__docs">
          <span>
            Documents {d.uploaded}/{d.required}
          </span>
          <span className="muted small">
            {d.approved} approved{d.rejected ? ` · ${d.rejected} rejected` : ''}
          </span>
        </div>
        <div className="admin-row__status">
          <StatusChip status={p.status} />
          <span className="muted small">{joined(p.createdAt)}</span>
        </div>
        <ChevronRight size={18} className="admin-row__chevron" aria-hidden="true" />
      </Link>
    </li>
  )
}

export default function AdminProviders() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'pending'
  const district = params.get('district') || ''
  const service = params.get('service') || ''
  const page = Number(params.get('page')) || 1
  const [query, setQuery] = useState(params.get('q') || '')
  const [data, setData] = useState(null)
  const [options, setOptions] = useState(null)
  const [error, setError] = useState(null)

  const setParam = useCallback(
    (key, value) =>
      setParams(
        (prev) => {
          // Unchanged value: keep the URL (and the current page) as it is
          if ((prev.get(key) || '') === (value || '')) return prev
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // Search after typing pauses, so every keystroke doesn't hit the API
  useEffect(() => {
    const timer = setTimeout(() => setParam('q', query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query, setParam])

  const q = params.get('q') || ''
  useEffect(() => {
    const search = new URLSearchParams({ status, page: String(page) })
    if (q) search.set('q', q)
    if (district) search.set('district', district)
    if (service) search.set('service', service)
    api(`/admin/providers?${search}`, { token })
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [token, status, q, district, service, page])

  useEffect(() => {
    api('/providers/options').then(setOptions).catch(() => {})
  }, [])

  const labels = Object.fromEntries((options?.services ?? []).map((s) => [s.value, s.label]))
  const filtered = Boolean(q || district || service)

  return (
    <div className="admin">
      <header className="admin__head">
        <h1>Providers</h1>
        <p className="muted">Review new applications and manage verified providers.</p>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            className={`tab${status === t.value ? ' tab--on' : ''}`}
            onClick={() => setParam('status', t.value === 'pending' ? '' : t.value)}
          >
            {t.label}
            {data && <span className="tab__count">{data.counts[t.value]}</span>}
          </button>
        ))}
      </div>

      <div className="filters">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or NIC"
            aria-label="Search providers"
          />
        </label>
        <select value={district} onChange={(e) => setParam('district', e.target.value)} aria-label="Filter by district">
          <option value="">All districts</option>
          {options?.districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select value={service} onChange={(e) => setParam('service', e.target.value)} aria-label="Filter by service">
          <option value="">All services</option>
          {options?.services.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="alert alert--error">{error}</p>}
      {!data && !error && <p className="muted">Loading providers…</p>}

      {data && data.providers.length === 0 && (
        <div className="empty">
          <p>
            <strong>{filtered ? 'No providers match these filters.' : 'Nothing here right now.'}</strong>
          </p>
          <p className="muted">
            {status === 'pending' && !filtered ? 'New applications will appear here.' : 'Try another tab or clear the search.'}
          </p>
        </div>
      )}

      {data && data.providers.length > 0 && (
        <>
          <ul className="admin-list">
            {data.providers.map((p) => (
              <ProviderRow key={p._id} p={p} token={token} labels={labels} />
            ))}
          </ul>
          {data.pages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button type="button" className="btn btn--ghost btn--small" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                Previous
              </button>
              <span className="muted small">
                Page {data.page} of {data.pages}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                disabled={page >= data.pages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
