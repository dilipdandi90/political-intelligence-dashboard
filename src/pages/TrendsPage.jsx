import { useMemo } from 'react'
import { ChartCard } from '../components/common/ChartCard'
import { DataTable } from '../components/common/DataTable'
import { PartyTag } from '../components/common/PartyTag'
import { AsyncContent, EmptyState, ErrorState, LoadingState } from '../components/common/StatusMessage'
import { TrendLineChart } from '../components/charts/TrendLineChart'
import { FilterBar } from '../components/filters/FilterBar'
import { SelectField } from '../components/filters/SelectField'
import { YearFilter } from '../components/filters/YearFilter'
import { PageHeader, Section } from '../components/layout/PageHeader'
import { useAssemblyResults, useLokSabhaResults } from '../hooks/useElectionData'
import { useUrlList, useUrlValue } from '../hooks/useUrlState'
import { assemblyElectionLabels, partyShareMatrix, segmentsWonByParty } from '../utils/assemblySelectors'
import { electionLabel, leadingParties, partyShareRows, partySwings, summarizeElection } from '../utils/electionMath'
import { formatNumber, formatPct, formatPp, NA } from '../utils/format'
import { partyColor, partyName } from '../utils/parties'

const FORMULAS = [
  { name: 'Vote share (%)', formula: 'Candidate votes ÷ Total valid votes × 100', note: 'Total valid votes = votes for all candidates. NOTA is excluded, matching the ECI definition used for deposit forfeiture.' },
  { name: 'Winning margin (votes)', formula: "Winner's votes − Runner-up's votes", note: 'Winner and runner-up are the top two candidates by votes.' },
  { name: 'Winning margin (%)', formula: 'Winning margin ÷ Total valid votes × 100', note: 'Expressed in percentage points of the valid vote.' },
  { name: 'Voter turnout (%)', formula: 'Total votes polled ÷ Registered electors × 100', note: 'Votes polled include NOTA. Where a source does not publish electors or votes polled, its own turnout figure is shown and flagged.' },
  { name: 'NOTA share (%)', formula: 'NOTA votes ÷ (Total valid votes + NOTA) × 100', note: 'NOTA exists only from 2013; earlier elections show “not applicable”.' },
  { name: 'Swing (pp)', formula: 'Party vote share (this election) − Party vote share (previous election)', note: 'Only computed when the party appears in both elections.' },
]

export default function TrendsPage() {
  const lokSabha = useLokSabhaResults()
  const assembly = useAssemblyResults()

  return (
    <>
      <PageHeader title="Electoral trends & indicators" eyebrow="Module 4 · Calculated indicators">
        <p>
          Every indicator below is calculated from the aggregate results with the formulas listed here. They describe
          constituency-level outcomes only and say nothing about how any individual or group voted.
        </p>
      </PageHeader>

      <Section id="formulas" title="Formulas and denominators">
        <div className="formula-grid">
          {FORMULAS.map((f) => (
            <div key={f.name} className="formula">
              <p className="formula__name">{f.name}</p>
              <p className="formula__expr">
                <code>{f.formula}</code>
              </p>
              <p className="formula__note">{f.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <AsyncContent query={lokSabha} loadingLabel="Loading Lok Sabha results…" errorTitle="Could not load Lok Sabha results">
        {(ls) => <ParliamentaryTrends elections={ls.elections} />}
      </AsyncContent>

      {assembly.status === 'loading' && <LoadingState label="Loading assembly results…" />}
      {assembly.status === 'error' && <ErrorState title="Could not load assembly results" error={assembly.error} onRetry={assembly.retry} />}
      {assembly.status === 'success' && <AssemblyTrends segments={assembly.data.segments} />}
    </>
  )
}

function ParliamentaryTrends({ elections }) {
  const allYears = useMemo(() => elections.map((e) => String(e.year)), [elections])
  const [years, setYears] = useUrlList('lsYears', allYears, allYears)
  const selected = elections.filter((e) => years.includes(String(e.year)))
  const partyOptions = useMemo(() => leadingParties(elections, 2), [elections])
  const [party, setParty] = useUrlValue('party', partyOptions, partyOptions[0])

  const summaries = selected.map(summarizeElection)
  const swings = partySwings(selected, party)
  const parties = leadingParties(selected, 5)

  return (
    <Section id="ls-trends" title="Parliamentary indicators (Pune PC)">
      <FilterBar label="Parliamentary trend filters">
        <YearFilter legend="Lok Sabha years" options={allYears.map((y) => ({ value: y, label: y }))} selected={years} onChange={setYears} />
        <SelectField
          label="Party for swing analysis"
          value={party}
          onChange={setParty}
          options={partyOptions.map((p) => ({ value: p, label: `${p} – ${partyName(p)}` }))}
        />
      </FilterBar>

      {selected.length === 0 ? (
        <EmptyState title="No years selected">Select at least one Lok Sabha year.</EmptyState>
      ) : (
        <>
          <div className="card">
            <h3 className="card__title">Indicator table</h3>
            <p className="card__subtitle">All values calculated from the dataset with the formulas above.</p>
            <DataTable
              caption="Calculated Lok Sabha indicators"
              rows={summaries}
              rowKey={(s) => s.record.id}
              initialSort={{ key: 'year', dir: 'asc' }}
              columns={[
                { key: 'year', header: 'Year', sortValue: (s) => s.record.year, render: (s) => s.label },
                { key: 'winner', header: 'Winner', render: (s) => (s.winner ? <PartyTag party={s.winner.party} /> : '—') },
                { key: 'share', header: 'Winner share', align: 'right', sortValue: (s) => s.winner?.voteShare, render: (s) => formatPct(s.winner?.voteShare) },
                { key: 'margin', header: 'Margin (votes)', align: 'right', sortValue: (s) => s.marginVotes, render: (s) => formatNumber(s.marginVotes) },
                { key: 'marginPct', header: 'Margin (%)', align: 'right', sortValue: (s) => s.marginPct, render: (s) => formatPct(s.marginPct) },
                { key: 'turnout', header: 'Turnout', align: 'right', sortValue: (s) => s.turnoutPct, render: (s) => `${formatPct(s.turnoutPct)}${s.turnoutBasis === 'reported' ? ' (reported)' : ''}` },
                { key: 'nota', header: 'NOTA share', align: 'right', sortValue: (s) => s.notaPct, render: (s) => (s.record.year < 2013 ? 'n/a (pre-2013)' : formatPct(s.notaPct)) },
                { key: 'valid', header: 'Valid votes', align: 'right', sortValue: (s) => s.validVotes, render: (s) => formatNumber(s.validVotes) },
              ]}
            />
          </div>

          <div className="grid grid--2">
            <ChartCard
              title="Party performance over time"
              subtitle="Vote share, % of total valid votes"
              description={`Line chart of vote share for ${parties.join(', ')} across ${years.join(', ')}`}
              sources={[{ label: 'Lok Sabha dataset (ECI-derived)' }]}
              footnote="Gaps mean the party did not contest or was not among the listed candidates."
            >
              <TrendLineChart data={partyShareRows(selected, parties)} series={parties.map((p) => ({ key: p, label: p, color: partyColor(p) }))} yDomain={[0, 100]} />
            </ChartCard>

            <div className="card">
              <h3 className="card__title">Vote-share swing: {party}</h3>
              <p className="card__subtitle">Change between consecutive selected elections, in percentage points</p>
              {swings.length === 0 ? (
                <EmptyState title="Select at least two years to see a swing" />
              ) : (
                <DataTable
                  caption={`${party} swing`}
                  rows={swings}
                  rowKey={(s) => `${s.from}-${s.to}`}
                  columns={[
                    { key: 'period', header: 'Between', render: (s) => `${s.from} → ${s.to}` },
                    { key: 'previousShare', header: 'Before', align: 'right', render: (s) => formatPct(s.previousShare) },
                    { key: 'currentShare', header: 'After', align: 'right', render: (s) => formatPct(s.currentShare) },
                    {
                      key: 'swing',
                      header: 'Swing',
                      align: 'right',
                      render: (s) => <span className={s.swing > 0 ? 'pos' : s.swing < 0 ? 'neg' : undefined}>{formatPp(s.swing)}</span>,
                    },
                  ]}
                />
              )}
              <p className="card__footnote">
                Outcome: {summaries.filter((s) => s.winner?.party === party).map((s) => s.label).join(', ') || 'no wins'} won by {party} among selected years.
              </p>
            </div>
          </div>
        </>
      )}
    </Section>
  )
}

function AssemblyTrends({ segments }) {
  const labels = useMemo(() => assemblyElectionLabels(segments, { includeByElections: false }), [segments])
  const allRecords = useMemo(() => segments.flatMap((s) => s.results), [segments])
  const partyOptions = useMemo(() => leadingParties(allRecords, 10), [allRecords])
  const [party, setParty] = useUrlValue('acParty', partyOptions, partyOptions[0])

  const wins = segmentsWonByParty(segments)
  const winningParties = [...new Set(Object.values(wins).flatMap((t) => Object.keys(t)))]
  const matrix = partyShareMatrix(segments, party, labels)

  const turnoutRows = labels.map((label) => {
    const row = { year: label }
    for (const s of segments) {
      const r = s.results.find((x) => electionLabel(x) === label)
      row[s.name] = r ? summarizeElection(r).turnoutPct : null
    }
    return row
  })
  const segmentColors = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)']

  return (
    <Section id="ac-trends" title="Assembly-level comparison" description="Vidhan Sabha general elections only (the 2023 Kasba Peth by-election is excluded so years are comparable).">
      <div className="grid grid--2">
        <div className="card">
          <h3 className="card__title">Segments won by party</h3>
          <p className="card__subtitle">Number of the six assembly segments won in each Vidhan Sabha election</p>
          <DataTable
            caption="Segments won by party"
            rows={winningParties.map((p) => ({ party: p, ...Object.fromEntries(labels.map((l) => [l, wins[l]?.[p] ?? 0])) }))}
            rowKey={(r) => r.party}
            initialSort={{ key: labels.at(-1), dir: 'desc' }}
            columns={[
              { key: 'party', header: 'Party', render: (r) => <PartyTag party={r.party} /> },
              ...labels.map((l) => ({ key: l, header: l, align: 'right', sortable: true })),
            ]}
          />
        </div>

        <ChartCard
          title="Turnout by segment"
          subtitle="% of registered electors, Vidhan Sabha general elections"
          description="Line chart of voter turnout in each assembly segment across elections"
          sources={[{ label: 'Assembly dataset (ECI-derived)' }]}
          footnote="Vadgaon Sheri turnout is as reported by the source (votes polled not published)."
        >
          <TrendLineChart data={turnoutRows} series={segments.map((s, i) => ({ key: s.name, label: s.name, color: segmentColors[i % segmentColors.length] }))} yDomain={[30, 70]} />
        </ChartCard>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Vote share heat-table: {party}</h3>
            <p className="card__subtitle">% of total valid votes in each segment. Darker = higher share. Blank = did not contest or not listed.</p>
          </div>
          <div className="card__actions">
            <SelectField label="Party" value={party} onChange={setParty} options={partyOptions.map((p) => ({ value: p, label: p }))} />
          </div>
        </div>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={`${party} vote share by segment and year`}>
          <table className="heat-table">
            <caption className="visually-hidden">{party} vote share by assembly segment and election</caption>
            <thead>
              <tr>
                <th scope="col">Segment</th>
                {labels.map((l) => (
                  <th key={l} scope="col" className="num">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map(({ segment, shares }) => (
                <tr key={segment.acNo}>
                  <th scope="row">
                    {segment.acNo} {segment.name}
                  </th>
                  {labels.map((l) => {
                    const v = shares[l]
                    return (
                      <td
                        key={l}
                        className="num heat-cell"
                        style={v != null ? { '--heat': Math.min(v / 70, 1), '--heat-color': partyColor(party) } : undefined}
                      >
                        {v === undefined ? NA : v == null ? '' : formatPct(v, 1)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}
