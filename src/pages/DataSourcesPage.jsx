import { useMemo } from 'react'
import { PageHeader, Section } from '../components/layout/PageHeader'
import { LoadingState } from '../components/common/StatusMessage'
import { useAssemblyResults, useConstituencyProfile, useLokSabhaResults } from '../hooks/useElectionData'

/** Collects every distinct source URL referenced anywhere in the loaded datasets. */
function collectSources(...datasets) {
  const seen = new Map()
  const add = (list) => list?.forEach((s) => seen.set(s.url ?? s.label, s))
  for (const d of datasets) {
    if (!d) continue
    add(d.sources)
    d.demographics?.forEach((x) => add(x.sources))
    d.elections?.forEach((e) => add(e.sources))
    d.segments?.forEach((s) => s.results?.forEach((r) => add(r.sources)))
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export default function DataSourcesPage() {
  const profile = useConstituencyProfile()
  const lokSabha = useLokSabhaResults()
  const assembly = useAssemblyResults()
  const loading = [profile, lokSabha, assembly].some((q) => q.status === 'loading')

  const sources = useMemo(
    () => collectSources(profile.data, lokSabha.data, assembly.data),
    [profile.data, lokSabha.data, assembly.data],
  )
  const disclaimer = lokSabha.data?.meta?.disclaimer

  return (
    <>
      <PageHeader title="Data & methodology" eyebrow="Sources, assumptions and limitations">
        <p>What the numbers on this dashboard are, where they come from, and what they can&apos;t tell you.</p>
      </PageHeader>

      <Section id="what" title="What is in the dataset">
        <div className="prose card">
          <ul>
            <li>
              <strong>Constituency:</strong> Pune (PC 34), Maharashtra, on its post-2008 delimitation boundaries.
            </li>
            <li>
              <strong>Lok Sabha:</strong> general elections 2009, 2014, 2019 and 2024. Earlier elections were held on
              different boundaries and are not compared (only the list of MPs is shown).
            </li>
            <li>
              <strong>Vidhan Sabha:</strong> 2009, 2014, 2019 and 2024 general elections for all six segments, plus the
              2023 Kasba Peth by-election.
            </li>
            <li>
              <strong>Demographics:</strong> Census of India 2011 (the latest census published) for Pune district, Pune
              Municipal Corporation and Pune City tehsil. The census does not publish figures by parliamentary
              constituency, so none of these geographies match the constituency exactly.
            </li>
          </ul>
          {disclaimer && <p className="callout">{disclaimer}</p>}
        </div>
      </Section>

      <Section id="rules" title="Calculation rules and assumptions">
        <div className="prose card">
          <ul>
            <li>
              <strong>Total valid votes</strong> are votes for candidates and exclude NOTA. Vote share and margin % use
              this denominator. Some websites (including ECI&apos;s live results pages) include NOTA in the denominator,
              so their percentages can be slightly lower than the ones shown here.
            </li>
            <li>
              <strong>Partial candidate lists:</strong> minor candidates are grouped as &ldquo;Others&rdquo;. Their combined
              votes are total valid votes minus the listed candidates, so shares still add up to 100%.
            </li>
            <li>
              <strong>Turnout</strong> is votes polled ÷ registered electors. Where a source publishes only a turnout
              percentage (Vadgaon Sheri, Lok Sabha 2019) that figure is shown and labelled &ldquo;reported&rdquo;.
            </li>
            <li>
              <strong>Missing values</strong> are shown as &ldquo;N/A&rdquo; / &ldquo;Not available&rdquo;. They are never
              replaced by zero or estimated, and charts show gaps instead of interpolating.
            </li>
            <li>
              <strong>Party labels</strong> are as printed on the result. Shiv Sena (2022) and NCP (2023) split, so
              SHS(UBT) and NCP(SP) are tracked separately from SHS and NCP; trends across the split are not continuous.
            </li>
            <li>
              <strong>Aggregate data only:</strong> results are totals per constituency. Nothing here should be read as
              evidence of how any individual, community or group voted.
            </li>
          </ul>
        </div>
      </Section>

      <Section id="limits" title="Known limitations">
        <div className="prose card">
          <ul>
            <li>
              ECI result pages could not be fetched directly when the dataset was compiled. Vote counts were taken from
              IndiaVotes and Wikipedia (which cites ECI) and cross-checked between them; candidate votes agreed exactly
              except for Vadgaon Sheri 2019, where the Wikipedia/ECI figures were used.
            </li>
            <li>
              Registered-elector counts differ slightly between sources for several assembly elections (up to a few
              thousand in 2019, possibly due to service voters). Turnout figures should be treated as approximate to ±1
              percentage point.
            </li>
            <li>
              The official District Census Handbook could not be opened; census figures come from secondary sites
              (census2011.co.in, citypopulation.de) whose numbers agree with each other and are internally consistent.
            </li>
            <li>
              The Delimitation Order describes segments by pre-2008 PMC ward numbers, which do not map one-to-one to
              today&apos;s wards or neighbourhoods.
            </li>
          </ul>
        </div>
      </Section>

      <Section id="api" title="Mock API">
        <div className="prose card">
          <p>
            There is no backend. The app reads three JSON files from <code>/public/data</code> through a small data
            layer (<code>src/api</code>) that validates every response, so it can be replaced by a real API without
            touching the UI:
          </p>
          <ul>
            <li>
              <code>GET /data/constituency.json</code> – profile, segments, MPs, census datasets
            </li>
            <li>
              <code>GET /data/lok-sabha.json</code> – Lok Sabha results
            </li>
            <li>
              <code>GET /data/assembly.json</code> – Vidhan Sabha results by segment
            </li>
          </ul>
          <p>
            To see the error states, add <code>?mockError=all</code> (or <code>?mockError=assembly</code>, etc.) to the
            URL. Set <code>VITE_MOCK_LATENCY_MS=1200</code> in <code>.env.local</code> to see loading states.
          </p>
        </div>
      </Section>

      <Section id="sources" title="All sources referenced">
        <div className="card">
          {loading ? (
            <LoadingState label="Collecting sources…" />
          ) : (
            <ul className="source-list">
              {sources.map((s) => (
                <li key={s.url ?? s.label}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </>
  )
}
