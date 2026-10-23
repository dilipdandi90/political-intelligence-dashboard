import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useIsPhone } from '../../hooks/useMediaQuery'
import { AXIS_TICK, GRID_STROKE, tooltipStyle, UNIT_FORMATTERS } from './chartTheme'

export function GroupedBarChart({ data, xKey, series, unit = 'percent', height = 320, yDomain, layout = 'horizontal' }) {
  const fmt = UNIT_FORMATTERS[unit]
  const vertical = layout === 'vertical'
  const phone = useIsPhone()
  const tick = phone ? { ...AXIS_TICK, fontSize: 11 } : AXIS_TICK
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: phone ? 8 : 16, bottom: 4, left: vertical && !phone ? 8 : 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={vertical} horizontal={!vertical} strokeDasharray="3 3" />
        {vertical ? (
          <>
            <XAxis type="number" tick={tick} tickFormatter={fmt.axis} domain={yDomain} />
            <YAxis type="category" dataKey={xKey} tick={tick} width={phone ? 90 : 120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={tick} />
            <YAxis tick={tick} tickFormatter={fmt.axis} domain={yDomain} width={phone ? 44 : 56} />
          </>
        )}
        <Tooltip
          {...tooltipStyle()}
          cursor={{ fill: 'var(--color-hover)' }}
          formatter={(value, name) => [value == null ? 'Not listed' : fmt.tooltip(value), name]}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 13 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={s.color} radius={vertical ? [0, 3, 3, 0] : [3, 3, 0, 0]} maxBarSize={44} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
