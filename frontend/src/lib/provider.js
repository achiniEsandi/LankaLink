// Experience is stored as a number; providers pick a friendly range
export const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1 to 2 years' },
  { value: 3, label: '3 to 5 years' },
  { value: 6, label: '6 to 10 years' },
  { value: 11, label: 'More than 10 years' },
]

export function experienceLabel(years) {
  const match = [...EXPERIENCE_OPTIONS].reverse().find((o) => years >= o.value)
  return match ? match.label : EXPERIENCE_OPTIONS[0].label
}

export const normalisePhone = (phone) => phone.replace(/[\s-]/g, '')
export const normaliseNic = (nic) => nic.trim().toUpperCase()
