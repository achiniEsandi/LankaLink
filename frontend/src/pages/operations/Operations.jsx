import { Bell, CreditCard } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import AnalyticsTab from './AnalyticsTab'
import EvidenceTab from './EvidenceTab'
import GpsTab from './GpsTab'
import NotificationsDialog from './NotificationsDialog'
import PaymentDialog from './PaymentDialog'
import { formatDuration } from './helpers'
import { DEFAULT_REPORT, INITIAL_COMMISSIONS, INITIAL_NOTIFICATIONS, INITIAL_PROVIDERS } from './sampleData'

const TABS = [
  { value: 'analytics', label: 'Analytics & finance' },
  { value: 'gps', label: 'Provider GPS' },
  { value: 'evidence', label: 'Evidence' },
]

const SAMPLE_UPDATES = [
  { category: 'Provider Arrived', title: 'Provider arrived in Dehiwala', detail: 'Roshan Silva reached 14 Marine Drive Terrace.', targetView: 'gps' },
  { category: 'Payment Cleared', title: 'Overseas payment cleared (£331.80)', detail: 'A London customer paid their monthly garden plan.', targetView: 'analytics' },
  { category: 'New Service Report', title: 'Inspection report uploaded', detail: '4 photos attached for a Colombo 03 visit.', targetView: 'evidence' },
]

let notificationSeq = 0

// Admin operations preview (Ahmed's analytics, GPS check-in and evidence screens).
// Runs on sample data until the payment, GPS and evidence endpoints exist.
export default function Operations() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'analytics'
  const openTab = (value) => setParams(value === 'analytics' ? {} : { tab: value }, { replace: true })

  const [commissions, setCommissions] = useState(INITIAL_COMMISSIONS)
  const [providers, setProviders] = useState(INITIAL_PROVIDERS)
  const [selectedId, setSelectedId] = useState(INITIAL_PROVIDERS[0].id)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [report, setReport] = useState(DEFAULT_REPORT)
  const [upload, setUpload] = useState({ active: false, progress: 0 })
  const [payingId, setPayingId] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const provider = providers.find((p) => p.id === selectedId) ?? providers[0]
  const unread = notifications.filter((n) => n.unread).length
  const totalRevenueUsd = useMemo(
    () => 48650 + commissions.filter((c) => c.status === 'Completed').reduce((sum, c) => sum + c.amountUsd, 0),
    [commissions],
  )
  const activeCount = 139 + commissions.filter((c) => c.status === 'Active').length

  function notify(category, title, detail, targetView) {
    notificationSeq += 1
    setNotifications((list) => [
      { id: `notif-new-${notificationSeq}`, category, title, detail, targetView, timestamp: 'Just now', unread: true },
      ...list,
    ])
  }

  function toggleCheckIn(id) {
    const p = providers.find((x) => x.id === id)
    if (!p) return
    if (!p.checkedIn) {
      notify('Provider Arrived', `${p.name} checked in on site`, `Inside the GPS area at ${p.destination}, ${p.district}.`, 'gps')
      setProviders((list) => list.map((x) => (x.id === id ? { ...x, checkedIn: true, checkedInAt: Date.now() } : x)))
    } else {
      const seconds = p.checkedInAt ? Math.max(1, Math.floor((Date.now() - p.checkedInAt) / 1000)) : 120
      notify('New Service Report', `${p.name} checked out`, `Spent ${formatDuration(seconds)} on site at ${p.destination}.`, 'gps')
      setProviders((list) =>
        list.map((x) => (x.id === id ? { ...x, checkedIn: false, checkedInAt: null, lastDurationSec: seconds } : x)),
      )
    }
  }

  // Small movement, to show a live location refresh
  function refreshLocation(id) {
    setProviders((list) =>
      list.map((x) =>
        x.id === id
          ? {
              ...x,
              coordinates: {
                lat: Number((x.coordinates.lat + (Math.random() - 0.5) * 0.0008).toFixed(4)),
                lng: Number((x.coordinates.lng + (Math.random() - 0.5) * 0.0008).toFixed(4)),
              },
            }
          : x,
      ),
    )
  }

  // Simulated upload: progress, then a new report built from the selected provider's visit
  function runUpload(fileName, fileSize, mediaType, previewUrl) {
    setUpload({ active: true, progress: 0 })
    const start = performance.now()
    const step = (time) => {
      const ratio = Math.min(1, (time - start) / 1800)
      setUpload({ active: ratio < 1, progress: Math.round((1 - (1 - ratio) ** 2) * 100) })
      if (ratio < 1) {
        requestAnimationFrame(step)
        return
      }
      const id = `SR-2026-${Math.floor(1000 + Math.random() * 8999)}`
      setReport((old) => {
        if (old.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(old.previewUrl)
        return {
          id,
          fileName,
          fileSize,
          mediaType,
          previewUrl,
          providerName: provider.name,
          district: provider.district,
          submittedAt: 'Just now',
          gpsTag: `${provider.coordinates.lat.toFixed(4)}° N, ${provider.coordinates.lng.toFixed(4)}° E`,
          notes:
            mediaType === 'video'
              ? 'Walkthrough video uploaded and matched to the visit location for the customer to review.'
              : 'Inspection photo matched to the visit location and added to the service report.',
          checklist: [
            { id: 'c1', label: 'Photo location matches the customer address', verified: true },
            { id: 'c2', label: 'Work meets LankaLink standards', verified: true },
            { id: 'c3', label: 'Report published to the customer', verified: true },
          ],
        }
      })
      notify('New Service Report', `Report ${id} ready`, `${fileName} (${fileSize}) checked in ${provider.district}.`, 'evidence')
    }
    requestAnimationFrame(step)
  }

  function uploadFile(file) {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    runUpload(file.name, `${(file.size / (1024 * 1024)).toFixed(2)} MB`, mediaType, URL.createObjectURL(file))
  }

  function markPaid(commission, charge, via) {
    setCommissions((list) => list.map((c) => (c.id === commission.id ? { ...c, status: 'Completed', updatedAt: 'Just now' } : c)))
    notify('Payment Cleared', `Payment received (${charge})`, `${commission.id} · ${commission.service}, paid by ${via}.`, 'analytics')
  }

  function openNotification(n) {
    setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
    setNotificationsOpen(false)
    openTab(n.targetView)
  }

  return (
    <div className="admin operations">
      <header className="admin__head ops-head">
        <div>
          <h1>Operations</h1>
          <p className="muted">Revenue, provider check-ins and visit evidence in one place.</p>
        </div>
        <div className="ops-head__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setNotificationsOpen(true)}>
            <Bell size={16} aria-hidden="true" /> Notifications
            {unread > 0 && <span className="tab__count">{unread}</span>}
          </button>
          <button
            type="button"
            className="btn btn--ink btn--small"
            onClick={() => setPayingId(commissions.find((c) => c.status === 'Awaiting Payment')?.id ?? null)}
            disabled={!commissions.some((c) => c.status === 'Awaiting Payment')}
          >
            <CreditCard size={16} aria-hidden="true" /> Take a payment
          </button>
        </div>
      </header>

      <p className="note">
        Preview with sample data. Payments, GPS check-in and evidence uploads are not connected to LankaLink yet.
      </p>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`tab${tab === t.value ? ' tab--on' : ''}`}
            onClick={() => openTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <AnalyticsTab
          commissions={commissions}
          totalRevenueUsd={totalRevenueUsd}
          activeCount={activeCount}
          enRoute={providers.find((p) => !p.checkedIn)}
          report={report}
          onPay={(id) => setPayingId(id)}
          onOpenTab={openTab}
        />
      )}
      {tab === 'gps' && (
        <GpsTab
          providers={providers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleCheckIn={toggleCheckIn}
          onRefreshLocation={refreshLocation}
        />
      )}
      {tab === 'evidence' && (
        <EvidenceTab
          report={report}
          uploading={upload.active}
          progress={upload.progress}
          onUpload={uploadFile}
          onSampleUpload={() => runUpload('sample_inspection_photo.jpg', '2.40 MB', 'image', '/images/svc-house_cleaning.jpg')}
        />
      )}

      <PaymentDialog
        open={payingId !== null}
        commission={commissions.find((c) => c.id === payingId)}
        onClose={() => setPayingId(null)}
        onPaid={markPaid}
      />
      <NotificationsDialog
        open={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onOpen={openNotification}
        onMarkAllRead={() => setNotifications((list) => list.map((n) => ({ ...n, unread: false })))}
        onSimulate={() => {
          const pick = SAMPLE_UPDATES[notifications.length % SAMPLE_UPDATES.length]
          notify(pick.category, pick.title, pick.detail, pick.targetView)
        }}
      />
    </div>
  )
}
