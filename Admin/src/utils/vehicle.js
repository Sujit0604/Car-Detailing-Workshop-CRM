const COLOR_HEX = {
  white: '#f4f4f4',
  pearl: '#f2f2f2',
  silver: '#c9ccd1',
  grey: '#7a7f87',
  gray: '#7a7f87',
  black: '#1c1c1c',
  obsidian: '#141414',
  gunmetal: '#4a4f55',
  red: '#c62828',
  maroon: '#7b1e2b',
  burgundy: '#6d1a2c',
  blue: '#1f4e9c',
  navy: '#152a52',
  royal: '#2a52b8',
  sky: '#7fb3e6',
  green: '#2e7d4f',
  forest: '#1f4d33',
  olive: '#6b7a3a',
  yellow: '#e8b60a',
  orange: '#e2711d',
  bronze: '#9c6b34',
  gold: '#c9a227',
  beige: '#d9cbb3',
  cream: '#efe6d2',
  brown: '#5b3a29',
  tan: '#c19a6b',
  purple: '#5b2d82',
  violet: '#7c3aed',
  pink: '#e0559b',
  magenta: '#c2185b',
  teal: '#137a7a',
  turquoise: '#2ec4b6',
}

export const FALLBACK_COLOR_HEX = '#8a8580'

export function getColorHex(color) {
  if (!color) return null
  const key = String(color).trim().toLowerCase()
  if (COLOR_HEX[key]) return COLOR_HEX[key]

  const partial = Object.keys(COLOR_HEX).find((name) => key.includes(name))
  return partial ? COLOR_HEX[partial] : FALLBACK_COLOR_HEX
}

export function formatEnum(value) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function vehicleModelLabel(vehicle) {
  if (!vehicle) return null
  return [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(' ').trim() || null
}
