import { useMemo } from 'react'
import { ChartCard } from '../components/common/ChartCard'
import { DataTable } from '../components/common/DataTable'
import { PartyTag } from '../components/common/PartyTag'
import { Notes, SourceLine } from '../components/common/SourceList'
import { AsyncContent, EmptyState } from '../components/common/StatusMessage'
import { CandidateShareChart } from '../components/charts/CandidateShareChart'
import { GroupedBarChart } from '../components/charts/GroupedBarChart'
import { CandidateResultsTable } from '../components/election/CandidateResultsTable'
import { ResultKpis } from '../components/election/ResultKpis'
import { FilterBar } from '../components/filters/FilterBar'
import { SelectField } from '../components/filters/SelectField'
import { YearFilter } from '../components/filters/YearFilter'
import { PageHeader, Section, Stack } from '../components/layout/PageHeader'
import { useAssemblyResults } from '../hooks/useElectionData'
import { useUrlList, useUrlValue } from '../hooks/useUrlState'
import { assemblyElectionLabels, resultFor, segmentSummaries } from '../utils/assemblySelectors'
import { electionLabel, leadingParties, partyShareRows, summarizeElection } from '../utils/electionMath'
import { formatNumber, formatPct } from '../utils/format'
import { Card, CardTitle, Footnote, Callout, Grid } from '../components/ui'
import { partyColor } from '../utils/parties'

const SOURCES = [{ label: 'IndiaVotes and Wikipedia assembly constituency pages, reproducing ECI results' }]

export default function AssemblyPage() {
  const query = useAssemblyResults()
  return (
    <>
      <PageHeader title="Assembly segment explorer" eyebrow="Module 3 · Vidhan Sabha results">
        <p>
          Maharashtra Vidhan Sabha results for the six assembly constituencies that make up Pune PC. Choose a segment
          and the elections to include; the comparison further down puts all six side by side.
        </p>
      </PageHeader>
      <AsyncContent query={query} loadingLabel="Loading assembly results…" errorTitle="Could not load assembly results">
        {(data) => <AssemblyContent segments={data.segments} />}
      </AsyncContent>
    </>
  )
}

function AssemblyContent({ segments }) {
  const acOptions = useMemo(() => segments.map((s) => String(s.acNo)), [segments])
  const allLabels = useMemo(() => assemblyElectionLabels(segments), [segments])
  const generalLabels = useMemo(() => assemblyElectionLabels(segments, { includeByElections: false }), [segments])

  const [acParam, setAc] = useUrlValue('ac', acOptions, acOptions[0])
  const [years, setYears] = useUrlList('years', allLabels, allLabels)
  const [compareYear, setCompareYear] = useUrlValue('compare', generalLabels, generalLabels.at(-1))

  if (!segments.length) return <EmptyState title="No assembly results in the dataset" />
  const segment = segments.find((s) => String(s.acNo) === acParam) ?? segments[0]

  return (
    <>
      <FilterBar label="Assembly filters">
        <SelectField
          label="Assembly constituency"
          value={String(segment.acNo)}
          onChange={setAc}
          options={segments.map((s) => ({
            value: String(s.acNo),
            label: `${s.acNo} – ${s.name}${s.reservation !== 'GEN' ? ` (${s.reservation})` : ''}`,
          }))}
        />
        <YearFilter
          legend="Election years"
          options={allLabels.map((l) => ({ value: l, label: l }))}
          selected={years}
          onChange={setYears}
        />
      </FilterBar>

      <SegmentSection segment={segment} years={years} />
      <CrossSegmentSection segments={segments} compareYear={compareYear} generalLabels={generalLabels} onCompareYear={setCompareYear} />
    </>
  )
}

function SegmentSection({ segment, years }) {
  const records = segment.results.filter((r) => years.includes(electionLabel(r)))
  const missing = years.filter((y) => !resultFor(segment, y))
  const title = `${segment.acNo} – ${segment.name}`

  if (!years.length) {
    return (
      <Section id="segment" title={title}>
        <EmptyState title="No election years selected">Select at least one year above.</EmptyState>
      </Section>
    )
  }

  const summaries = records.map(summarizeElection)
  const parties = leadingParties(records, 5)
  const latest = records.at(-1)

  return (
    <Section
      id="segment"
      title={title}
      description={`${segment.reservation === 'SC' ? 'Reserved for Scheduled Castes' : 'General (unreserved)'} · ${segment.district} district`}
    >
      {missing.length > 0 && (
        <Callout role="note">
          No result for {segment.name} in: {missing.join(', ')}.{' '}
          {missing.some((m) => m.includes('bye')) ? 'By-elections are only held where a seat falls vacant.' : 'The election was not held for this seat or is not in the dataset.'}
        </Callout>
      )}

      {records.length === 0 ? (
        <EmptyState title={`No data for ${segment.name} in the selected years`} />
      ) : (
        <>
          <Card>
            <CardTitle>Results by election</CardTitle>
            <DataTable
              caption={`${segment.name} results by election`}
              rows={summaries}
              rowKey={(s) => s.record.id}
              initialSort={{ key: 'year', dir: 'desc' }}
              columns={[
                { key: 'year', header: 'Election', sortValue: (s) => s.record.year, render: (s) => s.label },
                { key: 'winner', header: 'Winner', render: (s) => s.winner?.name ?? '—' },
                { key: 'party', header: 'Party', sortValue: (s) => s.winner?.party, render: (s) => (s.winner ? <PartyTag party={s.winner.party} /> : '—') },
                { key: 'votes', header: 'Votes', align: 'right', sortValue: (s) => s.winner?.votes, render: (s) => formatNumber(s.winner?.votes) },
                { key: 'share', header: 'Vote share', align: 'right', sortValue: (s) => s.winner?.voteShare, render: (s) => formatPct(s.winner?.voteShare) },
                { key: 'runnerUp', header: 'Runner-up', render: (s) => (s.runnerUp ? `${s.runnerUp.name} (${s.runnerUp.party})` : '—') },
                { key: 'margin', header: 'Margin', align: 'right', sortValue: (s) => s.marginVotes, render: (s) => formatNumber(s.marginVotes) },
                { key: 'marginPct', header: 'Margin %', align: 'right', sortValue: (s) => s.marginPct, render: (s) => formatPct(s.marginPct) },
                { key: 'turnout', header: 'Turnout', align: 'right', sortValue: (s) => s.turnoutPct, render: (s) => (s.turnoutPct == null ? 'N/A' : formatPct(s.turnoutPct) + (s.turnoutBasis === 'reported' ? '*' : '')) },
              ]}
            />
            {summaries.some((s) => s.turnoutBasis === 'reported') && (
              <Footnote>* Turnout as reported by the source; votes polled not published.</Footnote>
            )}
          </Card>

          <ChartCard
            title={`Party vote share in ${segment.name}`}
            subtitle="% of total valid votes, parties with at least 5% in any selected election"
            description={`Grouped bar chart of party vote share in ${segment.name} for ${records.map(electionLabel).join(', ')}`}
            sources={SOURCES}
            footnote="Shiv Sena split in 2022 and the NCP in 2023; SHS(UBT) and NCP(SP) are shown as separate parties."
          >
            <GroupedBarChart data={partyShareRows(records, parties)} xKey="year" series={parties.map((p) => ({ key: p, label: p, color: partyColor(p) }))} yDomain={[0, 100]} />
          </ChartCard>

          <SegmentElectionDetail segment={segment} records={records} defaultLabel={electionLabel(latest)} />
        </>
      )}
    </Section>
  )
}

function SegmentElectionDetail({ segment, records, defaultLabel }) {
  const labels = records.map(electionLabel)
  const [detail, setDetail] = useUrlValue('detail', labels, defaultLabel)
  const record = records.find((r) => electionLabel(r) === detail) ?? records.at(-1)
  const summary = summarizeElection(record)

  return (
    <Stack>
      <FilterBar label="Election detail">
        <SelectField label="Show candidate-wise result for" value={electionLabel(record)} onChange={setDetail} options={labels.map((l) => ({ value: l, label: l }))} />
      </FilterBar>
      <ResultKpis summary={summary} title={`${segment.name} ${electionLabel(record)} result`} />
      <Grid cols="1-1">
        <ChartCard
          title={`Candidate vote share – ${segment.name}, ${electionLabel(record)}`}
          subtitle="% of total valid votes"
          description={`Bar chart of candidate vote share in ${segment.name}, ${electionLabel(record)}`}
          sources={record.sources}
        >
          <CandidateShareChart record={record} />
        </ChartCard>
        <Card>
          <CardTitle>Candidate-wise result</CardTitle>
          <CandidateResultsTable record={record} caption={`${segment.name} ${electionLabel(record)} candidates`} />
          <Notes notes={record.notes} />
          <SourceLine sources={record.sources} />
        </Card>
      </Grid>
    </Stack>
  )
}

function CrossSegmentSection({ segments, compareYear, generalLabels, onCompareYear }) {
  const rows = segmentSummaries(segments, compareYear)
  const chartRows = rows.map((r) => ({
    name: r.segment.name,
    winnerShare: r.winner?.voteShare ?? null,
    marginPct: r.marginPct,
    turnoutPct: r.turnoutPct,
  }))
  const records = rows.map((r) => r.record)
  const parties = leadingParties(records, 10)
  const partyRows = rows.map((r) => {
    const row = partyShareRows([r.record], parties)[0]
    return { ...row, name: r.segment.name }
  })

  return (
    <Section id="compare" title="Compare all six segments" description="Same election, every segment side by side.">
      <FilterBar label="Comparison filters">
        <SelectField
          label="Vidhan Sabha election"
          value={compareYear}
          onChange={onCompareYear}
          options={generalLabels.map((l) => ({ value: l, label: `${l} general election` }))}
          hint="By-elections are excluded so all six segments are compared on the same election."
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title={`No segment results for ${compareYear}`} />
      ) : (
        <>
          <Card>
            <CardTitle>Segment-wise outcome, {compareYear}</CardTitle>
            <DataTable
              caption={`Assembly segment outcomes ${compareYear}`}
              rows={rows}
              rowKey={(r) => r.segment.acNo}
              initialSort={{ key: 'ac', dir: 'asc' }}
              columns={[
                { key: 'ac', header: 'AC', align: 'right', sortValue: (r) => r.segment.acNo, render: (r) => r.segment.acNo },
                { key: 'name', header: 'Segment', sortValue: (r) => r.segment.name, render: (r) => r.segment.name },
                { key: 'winner', header: 'Winner', render: (r) => r.winner?.name ?? '—' },
                { key: 'party', header: 'Party', sortValue: (r) => r.winner?.party, render: (r) => (r.winner ? <PartyTag party={r.winner.party} /> : '—') },
                { key: 'share', header: 'Vote share', align: 'right', sortValue: (r) => r.winner?.voteShare, render: (r) => formatPct(r.winner?.voteShare) },
                { key: 'margin', header: 'Margin', align: 'right', sortValue: (r) => r.marginVotes, render: (r) => formatNumber(r.marginVotes) },
                { key: 'marginPct', header: 'Margin %', align: 'right', sortValue: (r) => r.marginPct, render: (r) => formatPct(r.marginPct) },
                { key: 'turnout', header: 'Turnout', align: 'right', sortValue: (r) => r.turnoutPct, render: (r) => formatPct(r.turnoutPct) },
                { key: 'electors', header: 'Electors', align: 'right', sortValue: (r) => r.record.electors, render: (r) => formatNumber(r.record.electors) },
              ]}
            />
          </Card>

          <Grid cols={2}>
            <ChartCard
              title={`Winner's vote share and margin, ${compareYear}`}
              subtitle="% of total valid votes in each segment"
              description={`Bar chart comparing winner's vote share and winning margin across segments in ${compareYear}`}
              sources={SOURCES}
            >
              <GroupedBarChart
                data={chartRows}
                xKey="name"
                layout="vertical"
                series={[
                  { key: 'winnerShare', label: "Winner's share", color: 'var(--color-series-1)' },
                  { key: 'marginPct', label: 'Margin', color: 'var(--color-series-3)' },
                ]}
                yDomain={[0, 100]}
                height={340}
              />
            </ChartCard>

            <ChartCard
              title={`Party vote share by segment, ${compareYear}`}
              subtitle="% of total valid votes; parties with at least 10% in any segment"
              description={`Grouped bar chart of party vote share in each segment in ${compareYear}`}
              sources={SOURCES}
            >
              <GroupedBarChart
                data={partyRows}
                xKey="name"
                layout="vertical"
                series={parties.map((p) => ({ key: p, label: p, color: partyColor(p) }))}
                yDomain={[0, 100]}
                height={Math.max(340, rows.length * 70)}
              />
            </ChartCard>
          </Grid>
        </>
      )}
    </Section>
  )
}
