import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChartCard } from '../components/common/ChartCard'
import { DataTable } from '../components/common/DataTable'
import { KpiCard, KpiGrid } from '../components/common/KpiCard'
import { PartyTag } from '../components/common/PartyTag'
import { Notes, SourceLine } from '../components/common/SourceList'
import { AsyncContent, EmptyState } from '../components/common/StatusMessage'
import { GroupedBarChart } from '../components/charts/GroupedBarChart'
import { ShareDonut } from '../components/charts/ShareDonut'
import { SelectField } from '../components/filters/SelectField'
import { PageHeader, Section } from '../components/layout/PageHeader'
import { useAssemblyResults, useConstituencyProfile, useLokSabhaResults } from '../hooks/useElectionData'
import { latestGeneralResult } from '../utils/assemblySelectors'
import { percent, summarizeElection } from '../utils/electionMath'
import { Card, CardTitle, CardSubtitle, LinkButton, Grid } from '../components/ui'
import { FilterBar } from '../components/filters/FilterBar'
import { formatNumber, formatPct, NA } from '../utils/format'

export default function OverviewPage() {
  const profile = useConstituencyProfile()
  const lokSabha = useLokSabhaResults()
  const assembly = useAssemblyResults()

  return (
    <>
      <PageHeader title="Pune Lok Sabha Constituency" eyebrow="Module 1 · Constituency overview">
        <p>
          Key facts about parliamentary constituency no. 34 in Maharashtra: its assembly segments, electorate and the
          demographic profile of the area it sits in.
        </p>
      </PageHeader>

      <AsyncContent query={lokSabha} loadingLabel="Loading latest result…" errorTitle="Could not load Lok Sabha results">
        {(ls) => <HeadlineKpis elections={ls.elections} />}
      </AsyncContent>

      <AsyncContent query={profile} loadingLabel="Loading constituency profile…" errorTitle="Could not load constituency profile">
        {(p) => (
          <>
            <CoverageSection profile={p} assembly={assembly} />
            <DemographicsSection profile={p} />
            <MembersSection profile={p} />
          </>
        )}
      </AsyncContent>
    </>
  )
}

function HeadlineKpis({ elections }) {
  const latest = elections.at(-1)
  if (!latest) return <EmptyState title="No Lok Sabha results available" />
  const s = summarizeElection(latest)

  return (
    <KpiGrid label={`Headline figures, ${latest.year} Lok Sabha election`}>
      <KpiCard label={`Registered electors (${latest.year})`} value={formatNumber(latest.electors)} />
      <KpiCard
        label={`Voter turnout (${latest.year})`}
        value={formatPct(s.turnoutPct)}
        hint={s.turnoutBasis === 'reported' ? 'As reported by source' : 'Votes polled ÷ electors'}
      />
      <KpiCard
        label="Sitting MP"
        value={s.winner?.name ?? NA}
        hint={s.winner ? `${s.winner.party} · elected ${latest.year}` : undefined}
      />
      <KpiCard
        label={`Winning margin (${latest.year})`}
        value={formatNumber(s.marginVotes)}
        hint={`${formatPct(s.marginPct)} of valid votes`}
      />
    </KpiGrid>
  )
}

const RESERVATION_LABEL = { GEN: 'General (unreserved)', SC: 'Reserved – SC', ST: 'Reserved – ST' }

function reservedSummary(segments) {
  const reserved = segments.filter((s) => s.reservation !== 'GEN')
  if (!reserved.length) return 'All unreserved'
  return `Reserved: ${reserved.map((s) => `${s.name} (${s.reservation})`).join(', ')}`
}

function CoverageSection({ profile, assembly }) {
  // Assembly data is optional here: if it fails, the segment table still renders without electors/MLA columns.
  const latestBySegment = useMemo(() => {
    if (assembly.status !== 'success') return new Map()
    return new Map(assembly.data.segments.map((s) => [s.acNo, latestGeneralResult(s)]))
  }, [assembly])

  const rows = profile.segments.map((seg) => {
    const latest = latestBySegment.get(seg.acNo)
    const summary = latest ? summarizeElection(latest) : null
    return { ...seg, latest, summary }
  })

  const electorsChart = rows
    .filter((r) => r.latest?.electors != null)
    .map((r) => ({ name: r.name, electors: r.latest.electors }))
  const electorsYear = rows.find((r) => r.latest)?.latest.year

  const columns = [
    { key: 'acNo', header: 'AC no.', sortable: true, align: 'right' },
    { key: 'name', header: 'Assembly constituency', sortable: true, render: (r) => <Link to={`/assembly?ac=${r.acNo}`}>{r.name}</Link> },
    { key: 'reservation', header: 'Category', sortable: true },
    {
      key: 'electors',
      header: `Electors (${electorsYear ?? '—'})`,
      align: 'right',
      sortValue: (r) => r.latest?.electors ?? null,
      render: (r) => formatNumber(r.latest?.electors),
    },
    {
      key: 'mla',
      header: 'Current MLA',
      render: (r) =>
        r.summary?.winner ? (
          <>
            {r.summary.winner.name} <PartyTag party={r.summary.winner.party} />
          </>
        ) : (
          NA
        ),
    },
    { key: 'extent', header: 'Area (per Delimitation Order 2008)', render: (r) => <span className="text-sm text-muted">{r.extent}</span> },
  ]

  return (
    <Section id="coverage" title="Geography and assembly segments" description={profile.coverage}>
      <KpiGrid label="Constituency facts">
        <KpiCard label="PC number" value={profile.pcNo != null ? String(profile.pcNo) : NA} hint={profile.state} />
        <KpiCard label="Category" value={RESERVATION_LABEL[profile.reservation] ?? profile.reservation} />
        <KpiCard label="District" value={profile.districts.join(', ') || NA} />
        <KpiCard
          label="Assembly segments"
          value={String(profile.segments.length)}
          hint={reservedSummary(profile.segments)}
        />
      </KpiGrid>

      <Grid cols="2-1">
        <Card>
          <CardTitle>Assembly constituencies in Pune PC</CardTitle>
          {assembly.status === 'loading' && <p className="text-sm text-muted">Loading latest assembly results…</p>}
          {assembly.status === 'error' && (
            <p className="text-sm text-muted" role="alert">
              Assembly results could not be loaded, so electors and MLAs are not shown.{' '}
              <LinkButton onClick={assembly.retry}>
                Retry
              </LinkButton>
            </p>
          )}
          <DataTable caption="Assembly segments of Pune PC" columns={columns} rows={rows} rowKey={(r) => r.acNo} />
          <Notes notes={[profile.delimitationNote, ...profile.segmentNotes]} />
          <SourceLine sources={profile.sources.slice(0, 1)} />
        </Card>

        <ChartCard
          title="Electors by assembly segment"
          subtitle={electorsYear ? `Registered electors, ${electorsYear} Vidhan Sabha election` : 'Registered electors'}
          description="Bar chart of registered electors in each of the six assembly segments"
          sources={[{ label: 'IndiaVotes / Wikipedia (ECI-derived)' }]}
        >
          {electorsChart.length ? (
            <GroupedBarChart
              data={electorsChart}
              xKey="name"
              layout="vertical"
              unit="count"
              series={[{ key: 'electors', label: 'Electors', color: 'var(--color-brand)' }]}
              height={280}
            />
          ) : (
            <EmptyState title="Electors by segment unavailable" />
          )}
        </ChartCard>
      </Grid>
    </Section>
  )
}

const DEMOGRAPHIC_ROWS = [
  { key: 'population', label: 'Total population', fmt: formatNumber },
  { key: 'males', label: 'Males', fmt: formatNumber },
  { key: 'females', label: 'Females', fmt: formatNumber },
  { key: 'sexRatio', label: 'Sex ratio (females per 1,000 males)', fmt: formatNumber },
  { key: 'child0to6', label: 'Children aged 0–6', fmt: formatNumber },
  { key: 'urbanPct', label: 'Urban population share', fmt: formatPct },
  { key: 'literacyRate', label: 'Literacy rate (age 7+)', fmt: formatPct },
  { key: 'literacyMale', label: 'Literacy rate – male', fmt: formatPct },
  { key: 'literacyFemale', label: 'Literacy rate – female', fmt: formatPct },
  { key: 'scPct', label: 'Scheduled Castes (% of population)', fmt: formatPct },
  { key: 'stPct', label: 'Scheduled Tribes (% of population)', fmt: formatPct },
  { key: 'densityPerKm2', label: 'Density (persons per km²)', fmt: formatNumber },
  { key: 'areaKm2', label: 'Area (km²)', fmt: formatNumber },
  { key: 'decadalGrowthPct', label: 'Decadal growth 2001–11', fmt: formatPct },
]

/** Adds the derived shares so they're computed in one place. */
function withDerived(f) {
  return {
    ...f,
    urbanPct: percent(f.urban, f.population),
    scPct: percent(f.scPopulation, f.population),
    stPct: percent(f.stPopulation, f.population),
  }
}

function DemographicsSection({ profile }) {
  const datasets = profile.demographics
  const [selectedId, setSelectedId] = useState(datasets[0]?.id)
  const dataset = datasets.find((d) => d.id === selectedId) ?? datasets[0]

  if (!dataset) {
    return (
      <Section id="demographics" title="Demographic profile">
        <EmptyState title="Demographic data unavailable" />
      </Section>
    )
  }

  const f = withDerived(dataset.figures)
  const year = dataset.referenceYear ?? NA

  const comparisonRows = DEMOGRAPHIC_ROWS.map((row) => ({
    ...row,
    values: datasets.map((d) => withDerived(d.figures)[row.key]),
  }))

  return (
    <Section
      id="demographics"
      title={`Demographic profile (Census ${year})`}
      description={profile.demographicsNote}
    >
      <FilterBar label="Demographic filters">
        <SelectField
          label="Geography"
          value={dataset.id}
          onChange={setSelectedId}
          options={datasets.map((d) => ({ value: d.id, label: `${d.title} (Census ${d.referenceYear})` }))}
          hint={dataset.geography}
        />
      </FilterBar>

      <KpiGrid label={`Census ${year} indicators for ${dataset.title}`}>
        <KpiCard label={`Population (${year})`} value={formatNumber(f.population)} />
        <KpiCard label="Sex ratio" value={formatNumber(f.sexRatio)} hint="Females per 1,000 males" />
        <KpiCard label="Literacy rate" value={formatPct(f.literacyRate)} hint="Population aged 7 and above" />
        <KpiCard label="Urban share" value={formatPct(f.urbanPct)} />
        <KpiCard label="SC population" value={formatPct(f.scPct)} hint={f.scPopulation != null ? formatNumber(f.scPopulation) : undefined} />
        <KpiCard label="ST population" value={formatPct(f.stPct)} hint={f.stPopulation != null ? formatNumber(f.stPopulation) : undefined} />
      </KpiGrid>

      <Grid cols={3}>
        <ChartCard
          title="Gender distribution"
          subtitle={`${dataset.title}, Census ${year}`}
          description={`Donut chart: ${formatNumber(f.males)} males and ${formatNumber(f.females)} females`}
          sources={dataset.sources.slice(0, 1)}
        >
          {f.males != null && f.females != null ? (
            <ShareDonut
              slices={[
                { name: 'Male', value: f.males, color: 'var(--color-series-1)' },
                { name: 'Female', value: f.females, color: 'var(--color-series-2)' },
              ]}
            />
          ) : (
            <EmptyState title="Gender split not available for this geography" />
          )}
        </ChartCard>

        <ChartCard
          title="Rural / urban distribution"
          subtitle={`${dataset.title}, Census ${year}`}
          description={`Donut chart: ${formatNumber(f.rural)} rural and ${formatNumber(f.urban)} urban residents`}
          sources={dataset.sources.slice(0, 1)}
          footnote={f.rural === 0 ? 'A municipal corporation is wholly urban by definition.' : undefined}
        >
          {f.rural != null && f.urban != null ? (
            <ShareDonut
              slices={[
                { name: 'Urban', value: f.urban, color: 'var(--color-series-3)' },
                { name: 'Rural', value: f.rural, color: 'var(--color-series-4)' },
              ]}
            />
          ) : (
            <EmptyState title="Rural/urban split not available" />
          )}
        </ChartCard>

        <ChartCard
          title="Literacy rate"
          subtitle={`% of population aged 7+, Census ${year}`}
          description={`Bar chart: literacy ${formatPct(f.literacyRate)} overall, ${formatPct(f.literacyMale)} male, ${formatPct(f.literacyFemale)} female`}
          sources={dataset.sources.slice(0, 1)}
        >
          {f.literacyRate != null ? (
            <GroupedBarChart
              data={[
                { group: 'Total', value: f.literacyRate },
                { group: 'Male', value: f.literacyMale },
                { group: 'Female', value: f.literacyFemale },
              ]}
              xKey="group"
              series={[{ key: 'value', label: 'Literacy rate', color: 'var(--color-brand)' }]}
              yDomain={[0, 100]}
              height={240}
            />
          ) : (
            <EmptyState title="Literacy not available for this geography" />
          )}
        </ChartCard>
      </Grid>

      <Card>
        <CardTitle>All indicators by geography</CardTitle>
        <CardSubtitle>Census of India {year}. &ldquo;N/A&rdquo; means the figure could not be verified from a reliable source.</CardSubtitle>
        <DataTable
          caption="Census indicators compared across geographies"
          rowKey={(r) => r.key}
          columns={[
            { key: 'label', header: 'Indicator' },
            ...datasets.map((d, i) => ({
              key: d.id,
              header: d.title,
              align: 'right',
              render: (r) => r.fmt(r.values[i]),
            })),
          ]}
          rows={comparisonRows}
        />
        <Notes notes={dataset.notes} title={`Notes on ${dataset.title}`} />
        <SourceLine sources={dataset.sources} />
      </Card>
    </Section>
  )
}

function MembersSection({ profile }) {
  return (
    <Section id="members" title="Members of Parliament since 1951" description={profile.membersNote}>
      <Card>
        <DataTable
          caption="Members of Parliament for Pune"
          searchable
          searchPlaceholder="Search by name, party or year"
          searchText={(r) => `${r.year} ${r.name} ${r.party}`}
          pageSize={8}
          initialSort={{ key: 'year', dir: 'desc' }}
          rowKey={(r) => `${r.year}-${r.name}`}
          columns={[
            { key: 'year', header: 'Year', sortable: true },
            { key: 'name', header: 'Member', sortable: true },
            { key: 'party', header: 'Party', sortable: true, render: (r) => <PartyTag party={r.party} /> },
          ]}
          rows={profile.members}
        />
        <SourceLine sources={profile.sources.slice(1, 2)} />
      </Card>
    </Section>
  )
}
