import { CUSTOMER_STATUS, STATUS_TONE } from '../../lib/bookings'

export default function BookingChip({ status, labels = CUSTOMER_STATUS }) {
  return <span className={`status-chip status-chip--${STATUS_TONE[status]}`}>{labels[status] ?? status}</span>
}
