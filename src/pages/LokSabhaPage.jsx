import { useMemo } from 'react'
import { ChartCard } from '../components/common/ChartCard'
import { DataTable } from '../components/common/DataTable'
import { PartyTag } from '../components/common/PartyTag'
import { Notes, SourceLine } from '../components/common/SourceList'
import { AsyncContent, EmptyState } from '../components/common/StatusMessage'
import { CandidateShareChart } from '../components/charts/CandidateShareChart'
import { GroupedBarChart } from '../components/charts/GroupedBarChart'
import { TrendLineChart } from '../components/charts/TrendLineChart'
import { CandidateResultsTable } from '../components/election/CandidateResultsTable'
import { ResultKpis } from '../components/election/ResultKpis'
import { FilterBar } from '../components/filters/FilterBar'
import { SelectField } from '../components/filters/SelectField'
import { YearFilter } from '../components/filters/YearFilter'
import { PageHeader, Section } from '../components/layout/PageHeader'
import { useLokSabhaResults } from '../hooks/useElectionData'
import { useUrlList, useUrlValue } from '../hooks/useUrlState'
import { leadingParties, partyShareRows, summarizeElection } from '../utils/electionMath'
import { formatNumber, formatPct } from '../utils/format'
import { Card, CardTitle, Footnote, Grid } from '../components/ui'
import { partyColor } from '../utils/parties'

export default function LokSabhaPage() {
  const query = useLokSabhaResults()
  return (
    <>
      <PageHeader title="Lok Sabha election history" eyebrow="Module 2 · Historical parliamentary results">
        <p>
          Results of every general election held on the current Pune boundaries (2009 onwards). Pick the years to
          compare, then a year to inspect candidate by candidate.
        </p>
      </PageHeader>
      <AsyncContent query={query} loadingLabel="Loading Lok Sabha results…" errorTitle="Could not load Lok Sabha results">
        {(data) => <LokSabhaContent elections={data.elections} />}
      </AsyncContent>
    </>
  )
}

function LokSabhaContent({ elections }) {
  const allYears = useMemo(() => elections.map((e) => String(e.year)), [elections])
  const [years, setYears] = useUrlList('years', allYears, allYears)
  const [focusParam, setFocus] = useUrlValue('focus', allYears, allYears.at(-1))

  const selected = useMemo(() => elections.filter((e) => years.includes(String(e.year))), [elections, years])
  const summaries = useMemo(() => selected.map(summarizeElection), [selected])

  // The focus year must be one of the selected years; fall back to the latest selected one.
  const focusYear = years.includes(focusParam) ? focusParam : years.at(-1)
  const focus = elections.find((e) => String(e.year) === focusYear)

  if (!elections.length) return <EmptyState title="No Lok Sabha results in the dataset" />

  return (
    <>
      <FilterBar label="Lok Sabha filters">
        <YearFilter
          legend="Compare election years"
          options={allYears.map((y) => ({ value: y, label: y }))}
          selected={years}
          onChange={setYears}
        />
        <SelectField
          label="Inspect year in detail"
          value={focusYear ?? ''}
          onChange={setFocus}
          options={years.length ? years.map((y) => ({ value: y, label: `${y} general election` })) : [{ value: '', label: 'Select a year first' }]}
        />
      </FilterBar>

      {selected.length === 0 ? (
        <EmptyState title="No election years selected">Choose at least one year above to see results.</EmptyState>
      ) : (
        <>
          <ComparisonSection summaries={summaries} selected={selected} />
          {focus && <FocusSection record={focus} />}
        </>
      )}
    </>
  )
}

function ComparisonSection({ summaries, selected }) {
  const parties = leadingParties(selected, 3)
  const shareRows = partyShareRows(selected, parties)
  const marginRows = summaries.map((s) => ({ year: s.label, marginPct: s.marginPct, turnoutPct: s.turnoutPct, notaPct: s.notaPct }))
  const sources = [{ label: 'IndiaVotes and Wikipedia, reproducing ECI results', url: 'https://indiavotes.com/lok-sabha/2024/maharashtra/pune/' }]

  const columns = [
    { key: 'year', header: 'Year', sortable: true, sortValue: (s) => s.record.year, render: (s) => s.label },
    { key: 'winner', header: 'Winner', sortValue: (s) => s.winner?.name, render: (s) => s.winner?.name ?? '—' },
    { key: 'party', header: 'Party', sortValue: (s) => s.winner?.party, render: (s) => (s.winner ? <PartyTag party={s.winner.party} /> : '—') },
    { key: 'votes', header: 'Votes', align: 'right', sortValue: (s) => s.winner?.votes, render: (s) => formatNumber(s.winner?.votes) },
    { key: 'share', header: 'Vote share', align: 'right', sortValue: (s) => s.winner?.voteShare, render: (s) => formatPct(s.winner?.voteShare) },
    { key: 'runnerUp', header: 'Runner-up', render: (s) => (s.runnerUp ? `${s.runnerUp.name} (${s.runnerUp.party})` : '—') },
    { key: 'marginVotes', header: 'Margin (votes)', align: 'right', sortValue: (s) => s.marginVotes, render: (s) => formatNumber(s.marginVotes) },
    { key: 'marginPct', header: 'Margin (%)', align: 'right', sortValue: (s) => s.marginPct, render: (s) => formatPct(s.marginPct) },
    { key: 'turnout', header: 'Turnout', align: 'right', sortValue: (s) => s.turnoutPct, render: (s) => formatPct(s.turnoutPct) + (s.turnoutBasis === 'reported' ? '*' : '') },
    { key: 'valid', header: 'Valid votes', align: 'right', sortValue: (s) => s.validVotes, render: (s) => formatNumber(s.validVotes) },
    { key: 'electors', header: 'Electors', align: 'right', sortValue: (s) => s.record.electors, render: (s) => formatNumber(s.record.electors) },
  ]

  return (
    <Section id="ls-compare" title="Year-on-year comparison" description={`${summaries.length} election${summaries.length > 1 ? 's' : ''} selected.`}>
      <Card>
        <CardTitle>Results summary</CardTitle>
        <DataTable caption="Lok Sabha results by year" columns={columns} rows={summaries} rowKey={(s) => s.record.id} initialSort={{ key: 'year', dir: 'desc' }} />
        {summaries.some((s) => s.turnoutBasis === 'reported') && (
          <Footnote>
            * Turnout as reported by the source, because registered electors could not be verified for that year.
          </Footnote>
        )}
      </Card>

      <Grid cols={2}>
        <ChartCard
          title="Party vote share by election"
          subtitle="% of total valid votes (excludes NOTA). Parties that reached 3% in any selected year."
          description={`Grouped bar chart of vote share for ${parties.join(', ')} across ${summaries.map((s) => s.label).join(', ')}`}
          sources={sources}
          footnote="A missing bar means the party did not contest, or was not among the listed candidates, that year."
        >
          <GroupedBarChart data={shareRows} xKey="year" series={parties.map((p) => ({ key: p, label: p, color: partyColor(p) }))} yDomain={[0, 100]} />
        </ChartCard>

        <ChartCard
          title="Winning margin, turnout and NOTA"
          subtitle="Margin as % of valid votes; turnout as % of electors; NOTA as % of votes incl. NOTA"
          description="Line chart of winning margin, turnout and NOTA share by election year"
          sources={sources}
          table={
            <DataTable
              caption="Margin, turnout and NOTA by year"
              rowKey={(r) => r.year}
              rows={marginRows}
              columns={[
                { key: 'year', header: 'Year' },
                { key: 'marginPct', header: 'Margin %', align: 'right', render: (r) => formatPct(r.marginPct) },
                { key: 'turnoutPct', header: 'Turnout %', align: 'right', render: (r) => formatPct(r.turnoutPct) },
                { key: 'notaPct', header: 'NOTA %', align: 'right', render: (r) => formatPct(r.notaPct) },
              ]}
            />
          }
        >
          <TrendLineChart
            data={marginRows}
            series={[
              { key: 'marginPct', label: 'Winning margin', color: 'var(--color-series-1)' },
              { key: 'turnoutPct', label: 'Turnout', color: 'var(--color-series-3)' },
              { key: 'notaPct', label: 'NOTA', color: 'var(--color-series-5)', dashed: true },
            ]}
            yDomain={[0, 'auto']}
          />
        </ChartCard>
      </Grid>
    </Section>
  )
}

function FocusSection({ record }) {
  const summary = summarizeElection(record)
  return (
    <Section id="ls-focus" title={`${record.year} general election in detail`}>
      <ResultKpis summary={summary} title={`${record.year} result`} />
      <Grid cols="1-1">
        <ChartCard
          title={`Candidate vote share, ${record.year}`}
          subtitle="% of total valid votes"
          description={`Bar chart: ${summary.winner?.name} ${formatPct(summary.winner?.voteShare)}, ${summary.runnerUp?.name} ${formatPct(summary.runnerUp?.voteShare)}`}
          sources={record.sources}
        >
          <CandidateShareChart record={record} />
        </ChartCard>
        <Card>
          <CardTitle>Candidate-wise result, {record.year}</CardTitle>
          <CandidateResultsTable record={record} caption={`Candidate-wise result ${record.year}`} />
          <Notes notes={record.notes} />
          <SourceLine sources={record.sources} />
        </Card>
      </Grid>
    </Section>
  )
}
