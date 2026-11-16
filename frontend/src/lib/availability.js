export const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export const PERIOD_LABELS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }

// [{ day: 'sat', periods: ['morning'] }] -> "Sat morning"
export function summariseAvailability(availability) {
  if (!availability?.length) return null
  return availability
    .map((a) => `${DAY_LABELS[a.day].slice(0, 3)} ${a.periods.map((p) => PERIOD_LABELS[p].toLowerCase()).join(', ')}`)
    .join(' · ')
}
