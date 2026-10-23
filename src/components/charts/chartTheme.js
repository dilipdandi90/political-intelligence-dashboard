import { formatCompact, formatNumber, formatPct } from '../../utils/format'

export const AXIS_TICK = { fill: 'var(--color-muted)', fontSize: 12 }
export const GRID_STROKE = 'var(--color-line)'

/** Value formatters keyed by unit, shared by axes and tooltips. */
export const UNIT_FORMATTERS = {
  percent: { axis: (v) => `${v}%`, tooltip: (v) => formatPct(v) },
  count: { axis: formatCompact, tooltip: formatNumber },
}

export function tooltipStyle() {
  return {
    contentStyle: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-line)',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgb(16 24 40 / 0.08)',
      fontSize: 13,
    },
    labelStyle: { fontWeight: 600, color: 'var(--color-ink)' },
  }
}
