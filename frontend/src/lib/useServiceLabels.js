import { useEffect, useState } from 'react'
import { api } from '../api/client'

// { house_cleaning: 'House cleaning', ... } for showing service names on booking screens
export function useServiceLabels() {
  const [labels, setLabels] = useState({})
  useEffect(() => {
    api('/bookings/options')
      .then((o) => setLabels(Object.fromEntries(o.services.map((s) => [s.value, s.label]))))
      .catch(() => {})
  }, [])
  return labels
}
