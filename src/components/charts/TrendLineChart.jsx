import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, GRID_STROKE, tooltipStyle, UNIT_FORMATTERS } from './chartTheme'

/**
 * Line chart over election years. `null` values are drawn as gaps
 * (connectNulls is off) so a missing figure is never interpolated.
 *
 * data:   [{ year: '2014', BJP: 57.7 }]
 * series: [{ key, label, color, dashed? }]
 */
export function TrendLineChart({ data, xKey = 'year', series, unit = 'percent', height = 300, yDomain }) {
  const fmt = UNIT_FORMATTERS[unit]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={AXIS_TICK} padding={{ left: 16, right: 16 }} />
        <YAxis tick={AXIS_TICK} tickFormatter={fmt.axis} domain={yDomain} width={56} />
        <Tooltip
          {...tooltipStyle()}
          formatter={(value, name) => [value == null ? 'Not available' : fmt.tooltip(value), name]}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 13 }} />}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            strokeWidth={2.5}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-surface)' }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
