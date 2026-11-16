// Bookings use calendar days (no time) in Sri Lanka, stored as UTC midnight.
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// "2026-11-20" -> Date at UTC midnight, or null when not a real date
export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export const formatDay = (date) => date.toISOString().slice(0, 10);

// Today's date in Sri Lanka, as UTC midnight
export function todaySL(now = new Date()) {
  const local = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(now);
  return parseDay(local);
}

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

// 'mon'...'sun', matching provider availability keys
export const weekdayKey = (date) => WEEKDAYS[date.getUTCDay()];
