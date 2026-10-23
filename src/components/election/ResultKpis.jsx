import { KpiCard, KpiGrid } from '../common/KpiCard'
import { formatNumber, formatPct, NA } from '../../utils/format'
import { partyColor } from '../../utils/parties'

/** Headline cards for one election, built from a summarizeElection() result. */
export function ResultKpis({ summary, title }) {
  const { winner, runnerUp, record } = summary
  return (
    <KpiGrid label={title}>
      <KpiCard
        label="Winner"
        value={winner?.name ?? NA}
        hint={winner ? `${winner.party} · ${formatNumber(winner.votes)} votes` : undefined}
        accent={winner ? partyColor(winner.party) : undefined}
      />
      <KpiCard label="Winner's vote share" value={formatPct(winner?.voteShare)} hint="of total valid votes" />
      <KpiCard
        label="Runner-up"
        value={runnerUp?.name ?? NA}
        hint={runnerUp ? `${runnerUp.party} · ${formatPct(runnerUp.voteShare)}` : undefined}
        accent={runnerUp ? partyColor(runnerUp.party) : undefined}
      />
      <KpiCard label="Winning margin" value={formatNumber(summary.marginVotes)} hint={`${formatPct(summary.marginPct)} of valid votes`} />
      <KpiCard
        label="Voter turnout"
        value={formatPct(summary.turnoutPct)}
        hint={summary.turnoutBasis === 'reported' ? 'Reported by source (electors/polled unavailable)' : `${formatNumber(record.votesPolled)} of ${formatNumber(record.electors)} electors`}
      />
      <KpiCard label="Total valid votes" value={formatNumber(summary.validVotes)} hint="Votes for candidates, excl. NOTA" />
    </KpiGrid>
  )
}
