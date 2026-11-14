const LABELS = {
  pending: 'Waiting for review',
  approved: 'Approved',
  rejected: 'Changes requested',
  suspended: 'Suspended',
}

export default function StatusChip({ status }) {
  return <span className={`status-chip status-chip--${status}`}>{LABELS[status] ?? status}</span>
}
