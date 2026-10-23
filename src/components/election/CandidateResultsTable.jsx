import { DataTable } from '../common/DataTable'
import { PartyTag } from '../common/PartyTag'
import { percent, rankCandidates, summarizeElection } from '../../utils/electionMath'
import { formatNumber, formatPct, NA } from '../../utils/format'
import { partyName } from '../../utils/parties'

const isOthersRow = (r) => r.type === 'others'

/**
 * Candidate-wise result of a single election.
 * Listed candidates are ranked; unlisted candidates appear as one "Others" row
 * (always last) and NOTA is shown separately because it is not part of total
 * valid votes.
 */
export function CandidateResultsTable({ record, caption }) {
  const summary = summarizeElection(record)
  const valid = summary.validVotes

  const rows = rankCandidates(record).map((c) => ({ ...c, type: 'candidate' }))
  if (summary.othersVotes > 0) {
    rows.push({
      type: 'others',
      rank: null,
      name: 'Others (not listed individually)',
      party: '—',
      votes: summary.othersVotes,
      voteShare: percent(summary.othersVotes, valid),
      forfeitedDeposit: null,
    })
  }

  const columns = [
    { key: 'rank', header: 'Rank', align: 'right', sortable: true, render: (r) => r.rank ?? '—' },
    {
      key: 'name',
      header: 'Candidate',
      sortable: true,
      render: (r) => (
        <>
          {r.name}
          {r.isWinner && <span className="ml-2 inline-block rounded-full bg-win px-2 py-px align-middle text-[0.72rem] font-semibold text-white">Winner</span>}
        </>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      sortable: true,
      render: (r) => (r.type === 'candidate' ? <PartyTag party={r.party} /> : '—'),
    },
    { key: 'votes', header: 'Votes', align: 'right', sortable: true, render: (r) => formatNumber(r.votes) },
    { key: 'voteShare', header: 'Vote share', align: 'right', sortable: true, render: (r) => formatPct(r.voteShare) },
    {
      key: 'forfeitedDeposit',
      header: 'Deposit',
      render: (r) => (r.forfeitedDeposit == null ? '—' : r.forfeitedDeposit ? 'Forfeited' : 'Retained'),
    },
  ]

  return (
    <>
      <DataTable
        caption={caption}
        columns={columns}
        rows={rows}
        rowKey={(r) => `${r.type}-${r.name}`}
        searchable
        searchPlaceholder="Search candidate or party"
        searchText={(r) => `${r.name} ${r.party} ${partyName(r.party)}`}
        initialSort={{ key: 'votes', dir: 'desc' }}
        pinBottom={isOthersRow}
        rowClassName={(r) => (r.isWinner ? 'bg-win-soft' : r.type === 'others' ? 'text-muted italic' : undefined)}
      />
      <dl className="mt-1 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-4 gap-y-2 text-sm [&_dd]:font-semibold [&_dd]:tabular-nums [&_dt]:text-xs [&_dt]:text-muted">
        <div>
          <dt>Total valid votes</dt>
          <dd>{formatNumber(valid)}</dd>
        </div>
        <div>
          <dt>NOTA</dt>
          <dd>
            {record.nota == null ? (record.year < 2013 ? 'Not applicable (before 2013)' : NA) : `${formatNumber(record.nota)} (${formatPct(summary.notaPct)} of votes incl. NOTA)`}
          </dd>
        </div>
        <div>
          <dt>Votes polled</dt>
          <dd>{formatNumber(record.votesPolled)}</dd>
        </div>
        <div>
          <dt>Registered electors</dt>
          <dd>{formatNumber(record.electors)}</dd>
        </div>
      </dl>
    </>
  )
}
