import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber, formatPct } from '../../utils/format'
import { OTHERS_COLOR, partyColor } from '../../utils/parties'
import { rankCandidates, totalValidVotes, unlistedVotes, percent } from '../../utils/electionMath'
import { useIsPhone } from '../../hooks/useMediaQuery'
import { AXIS_TICK, GRID_STROKE, tooltipStyle } from './chartTheme'

/** Horizontal bars of every listed candidate's vote share in one election, plus "Others". */
export function CandidateShareChart({ record, maxCandidates = 6 }) {
  const phone = useIsPhone()
  const all = rankCandidates(record)
  const ranked = all.slice(0, maxCandidates)
  const hidden = all.slice(maxCandidates)
  const valid = totalValidVotes(record)
  const othersVotes = (unlistedVotes(record) ?? 0) + hidden.reduce((t, c) => t + c.votes, 0)

  const data = ranked.map((c) => ({
    // phones get initials for every name so the label column can stay narrow
    label: `${shortName(c.name, phone)} (${c.party})`,
    share: c.voteShare,
    votes: c.votes,
    color: partyColor(c.party),
  }))
  if (othersVotes > 0) {
    data.push({ label: 'Others', share: percent(othersVotes, valid), votes: othersVotes, color: OTHERS_COLOR })
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: phone ? 44 : 56, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="label" tick={phone ? { ...AXIS_TICK, fontSize: 11 } : AXIS_TICK} width={phone ? 104 : 150} />
        <Tooltip
          {...tooltipStyle()}
          cursor={{ fill: 'var(--color-hover)' }}
          formatter={(value, _name, item) => [`${formatPct(value)} (${formatNumber(item.payload.votes)} votes)`, 'Vote share']}
        />
        <Bar dataKey="share" radius={[0, 3, 3, 0]} maxBarSize={28} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
          <LabelList dataKey="share" position="right" formatter={(v) => formatPct(v, 1)} style={{ fontSize: 12, fill: 'var(--color-ink)' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// "Ravindra Hemraj Dhangekar" → "R. H. Dhangekar" keeps axis labels readable on phones
function shortName(name, always = false) {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  if (parts.length < 2 || (parts.length === 2 && !always)) return name
  return `${parts.slice(0, -1).map((p) => `${p[0]}.`).join(' ')} ${parts.at(-1)}`
}
