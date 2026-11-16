// Shared wording for bookings, used by the customer, provider and admin screens

// What the customer sees at each stage
export const CUSTOMER_STATUS = {
  requested: 'Finding a professional',
  assigned: 'Waiting for the professional to accept',
  accepted: 'Confirmed',
  checked_in: 'In progress',
  completed: 'Done, please confirm',
  confirmed: 'Completed',
  cancelled: 'Cancelled',
}

export const ADMIN_STATUS = {
  requested: 'Unassigned',
  assigned: 'Offered',
  accepted: 'Accepted',
  checked_in: 'Checked in',
  completed: 'Completed',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

// Chip colour per status, reusing the existing status-chip styles
export const STATUS_TONE = {
  requested: 'pending',
  assigned: 'pending',
  accepted: 'approved',
  checked_in: 'approved',
  completed: 'approved',
  confirmed: 'approved',
  cancelled: 'rejected',
}

// Steps of the customer timeline, in order
export const TIMELINE = [
  { status: 'requested', title: 'Booking placed' },
  { status: 'assigned', title: 'Matched with a professional' },
  { status: 'accepted', title: 'Professional accepted' },
  { status: 'checked_in', title: 'Visit started' },
  { status: 'completed', title: 'Work completed' },
  { status: 'confirmed', title: 'You confirmed' },
]

export const FREQUENCY_LABELS = { weekly: 'Every week', fortnightly: 'Every 2 weeks', monthly: 'Every 4 weeks' }

export const PERIOD_HOURS = { morning: '8 am – 12 pm', afternoon: '12 pm – 4 pm', evening: '4 pm – 8 pm' }

// "2026-11-21" -> "Sat 21 Nov" (dates are calendar days, so format in UTC)
export function formatDay(day, { long = false } = {}) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
    ...(long && { year: 'numeric' }),
  })
}

export const formatWhen = (at) =>
  new Date(at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
