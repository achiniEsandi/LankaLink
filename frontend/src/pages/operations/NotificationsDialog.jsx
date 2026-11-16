import { Bell } from 'lucide-react'
import { useState } from 'react'
import OpsDialog from './OpsDialog'
import { NOTIFICATION_TONE } from './helpers'

export default function NotificationsDialog({ open, notifications, onClose, onOpen, onMarkAllRead, onSimulate }) {
  const [filter, setFilter] = useState('all')
  const unread = notifications.filter((n) => n.unread).length
  const visible = filter === 'unread' ? notifications.filter((n) => n.unread) : notifications

  return (
    <OpsDialog open={open} title="Notifications" onClose={onClose} wide>
      <div className="ops-notif__controls">
        <div className="tabs" role="tablist">
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={`tab${filter === value ? ' tab--on' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === 'unread' && <span className="tab__count">{unread}</span>}
            </button>
          ))}
        </div>
        <div className="ops-notif__actions">
          <button type="button" className="link-btn" onClick={onMarkAllRead} disabled={!unread}>
            Mark all as read
          </button>
          <button type="button" className="btn btn--ghost btn--small" onClick={onSimulate}>
            Simulate an update
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <Bell size={24} aria-hidden="true" />
          <p>No unread notifications.</p>
        </div>
      ) : (
        <ul className="ops-notif">
          {visible.map((n) => (
            <li key={n.id}>
              <button type="button" className={`ops-notif__item${n.unread ? ' ops-notif__item--unread' : ''}`} onClick={() => onOpen(n)}>
                <span className="ops-notif__top">
                  <span className={`status-chip status-chip--${NOTIFICATION_TONE[n.category] ?? 'neutral'}`}>{n.category}</span>
                  <span className="small muted">{n.timestamp}</span>
                </span>
                <strong>{n.title}</strong>
                <span className="small muted">{n.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </OpsDialog>
  )
}
