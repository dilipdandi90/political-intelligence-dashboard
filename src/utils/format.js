/** Shown wherever a value is missing from the source. Never substitute 0. */
export const NA = 'N/A'

const inNumber = new Intl.NumberFormat('en-IN')

/** 1234567 → "12,34,567" (Indian digit grouping, as used by ECI). */
export function formatNumber(value) {
  return value == null || !Number.isFinite(value) ? NA : inNumber.format(Math.round(value))
}

/** 54.6512 → "54.65%" */
export function formatPct(value, digits = 2) {
  return value == null || !Number.isFinite(value) ? NA : `${value.toFixed(digits)}%`
}

/** Percentage-point change with an explicit sign: "+3.20 pp", "−1.05 pp". */
export function formatPp(value, digits = 2) {
  if (value == null || !Number.isFinite(value)) return NA
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${Math.abs(value).toFixed(digits)} pp`
}

/** Compact Indian units for chart axes: 1250000 → "12.5 L", 25000000 → "2.5 Cr". */
export function formatCompact(value) {
  if (value == null || !Number.isFinite(value)) return NA
  const abs = Math.abs(value)
  if (abs >= 1e7) return `${trim(value / 1e7)} Cr`
  if (abs >= 1e5) return `${trim(value / 1e5)} L`
  if (abs >= 1e3) return `${trim(value / 1e3)} K`
  return String(value)
}

const trim = (n) => n.toFixed(1).replace(/\.0$/, '')
