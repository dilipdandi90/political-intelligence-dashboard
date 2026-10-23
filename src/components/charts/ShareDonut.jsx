import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { percent } from '../../utils/electionMath'
import { formatNumber, formatPct } from '../../utils/format'
import { tooltipStyle } from './chartTheme'

export function ShareDonut({ slices, height = 240 }) {
  const usable = slices.filter((s) => s.value != null && s.value > 0)
  const total = usable.reduce((t, s) => t + s.value, 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
        <Pie
          data={usable}
          dataKey="value"
          nameKey="name"
          innerRadius="50%"
          outerRadius="75%"
          paddingAngle={1}
          isAnimationActive={false}
          label={({ value }) => formatPct(percent(value, total), 1)}
          labelLine={false}
        >
          {usable.map((s) => (
            <Cell key={s.name} fill={s.color} stroke="var(--color-surface)" />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle()}
          formatter={(value, name) => [`${formatNumber(value)} (${formatPct(percent(value, total), 1)})`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
