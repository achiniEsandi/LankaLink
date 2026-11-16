// Small helpers shared by the operations preview tabs

// 2740 -> "00:45:40"
export function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':')
}

export const formatUsd = (amount) => `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

// Commission status -> existing status-chip colours
export const COMMISSION_TONE = { Active: 'neutral', 'Awaiting Payment': 'pending', Completed: 'approved' }

export const NOTIFICATION_TONE = {
  'Provider Arrived': 'neutral',
  'Payment Cleared': 'approved',
  'New Service Report': 'pending',
  'Commission Disbursed': 'approved',
}
