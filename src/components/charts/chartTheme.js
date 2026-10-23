import { formatCompact, formatNumber, formatPct } from '../../utils/format'

export const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 }
export const GRID_STROKE = 'var(--border)'

/** Value formatters keyed by unit, shared by axes and tooltips. */
export const UNIT_FORMATTERS = {
  percent: { axis: (v) => `${v}%`, tooltip: (v) => formatPct(v) },
  count: { axis: formatCompact, tooltip: formatNumber },
}

export function tooltipStyle() {
  return {
    contentStyle: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      boxShadow: 'var(--shadow)',
      fontSize: 13,
    },
    labelStyle: { fontWeight: 600, color: 'var(--text)' },
  }
}
