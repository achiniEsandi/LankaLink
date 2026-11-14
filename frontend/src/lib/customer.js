import { useEffect, useState } from 'react'
import { api } from '../api/client'

// Mirrors the backend checks so most mistakes are caught before submitting
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const INTL_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/

export const normaliseIntlPhone = (phone) => phone.replace(/[\s()-]/g, '')

export const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return ''
  }
}

export const formatRupees = (amount) => `Rs ${Number(amount).toLocaleString('en-LK')}`

export const labelOf = (options, value) => options?.find((o) => o.value === value)?.label ?? value

// Options lists rarely change, so fetch each once per page load
const optionsCache = new Map()

export function useOptions(path) {
  const [state, setState] = useState(() => ({ data: optionsCache.get(path) ?? null, error: null }))

  useEffect(() => {
    if (optionsCache.has(path)) return
    let live = true
    api(path)
      .then((data) => {
        optionsCache.set(path, data)
        if (live) setState({ data, error: null })
      })
      .catch((err) => live && setState({ data: null, error: err.message }))
    return () => {
      live = false
    }
  }, [path])

  return state
}

// Reads "6.9271, 79.8612" or a Google Maps link containing @lat,lng or q=lat,lng
export function parseCoordinates(text) {
  const value = text.trim()
  if (!value) return null
  const match =
    value.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    value.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    value.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

// Rough bounding box of Sri Lanka, same as the backend check
export const inSriLanka = ({ lat, lng }) => lat >= 5.8 && lat <= 9.9 && lng >= 79.4 && lng <= 81.95

// GeoJSON stores [lng, lat]; the forms show "lat, lng"
export const formatPoint = (location) =>
  location?.coordinates ? `${location.coordinates[1]}, ${location.coordinates[0]}` : ''

export const mapsLink = (location) =>
  location?.coordinates
    ? `https://www.google.com/maps?q=${location.coordinates[1]},${location.coordinates[0]}`
    : null
