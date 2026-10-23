import { NA } from '../../utils/format'
import { cx } from '../../utils/cx'

/**
 * A single headline figure. Pass the already-formatted value; if it is N/A
 * the card says so explicitly instead of showing an empty box.
 */
export function KpiCard({ label, value, hint, accent }) {
  const unavailable = value == null || value === NA
  return (
    <div
      data-kpi
      className="min-w-0 rounded-xl border border-l-4 border-line border-l-(--kpi-accent) bg-surface px-3.5 py-3 shadow-sm"
      style={{ '--kpi-accent': accent ?? 'var(--color-brand)' }}
    >
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd
        className={cx(
          'mt-1 leading-tight [overflow-wrap:anywhere] tabular-nums',
          unavailable ? 'text-base font-semibold text-muted italic' : 'text-[1.35rem] font-bold',
        )}
      >
        {unavailable ? 'Not available' : value}
      </dd>
      {hint && <dd className="mt-0.5 text-[13px] text-muted">{hint}</dd>}
    </div>
  )
}

export function KpiGrid({ children, label }) {
  return (
    <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 max-sm:gap-2" aria-label={label}>
      {children}
    </dl>
  )
}
