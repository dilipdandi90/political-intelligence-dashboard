import { NA } from '../../utils/format'

/**
 * A single headline figure. Pass the already-formatted value; if it is N/A
 * the card says so explicitly instead of showing an empty box.
 */
export function KpiCard({ label, value, hint, accent }) {
  const unavailable = value == null || value === NA
  return (
    <div className="kpi" style={accent ? { '--kpi-accent': accent } : undefined}>
      <dt className="kpi__label">{label}</dt>
      <dd className={`kpi__value${unavailable ? ' kpi__value--na' : ''}`}>{unavailable ? 'Not available' : value}</dd>
      {hint && <dd className="kpi__hint">{hint}</dd>}
    </div>
  )
}

export function KpiGrid({ children, label }) {
  return (
    <dl className="kpi-grid" aria-label={label}>
      {children}
    </dl>
  )
}
