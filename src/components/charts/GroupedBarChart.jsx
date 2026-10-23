import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, GRID_STROKE, tooltipStyle, UNIT_FORMATTERS } from './chartTheme'

export function GroupedBarChart({ data, xKey, series, unit = 'percent', height = 320, yDomain, layout = 'horizontal' }) {
  const fmt = UNIT_FORMATTERS[unit]
  const vertical = layout === 'vertical'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, bottom: 4, left: vertical ? 8 : 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={vertical} horizontal={!vertical} strokeDasharray="3 3" />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} tickFormatter={fmt.axis} domain={yDomain} />
            <YAxis type="category" dataKey={xKey} tick={AXIS_TICK} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={fmt.axis} domain={yDomain} width={56} />
          </>
        )}
        <Tooltip
          {...tooltipStyle()}
          cursor={{ fill: 'var(--hover)' }}
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
