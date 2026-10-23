import { electionLabel, partyShares, summarizeElection } from './electionMath'

/**
 * Helpers for slicing the assembly dataset by election. Elections are keyed by
 * their display label ("2019", "2023 (bye)") so a by-election never collides
 * with a general election held in the same year.
 */

/** All election labels present in any segment, chronological. */
export function assemblyElectionLabels(segments, { includeByElections = true } = {}) {
  const seen = new Map()
  for (const s of segments) {
    for (const r of s.results) {
      if (!includeByElections && r.kind === 'BYE_ELECTION') continue
      seen.set(electionLabel(r), r.year + (r.kind === 'BYE_ELECTION' ? 0.5 : 0))
    }
  }
  return [...seen.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label)
}

export function resultFor(segment, label) {
  return segment.results.find((r) => electionLabel(r) === label) ?? null
}

/** The most recent general (non-bye) election result of a segment. */
export function latestGeneralResult(segment) {
  const general = segment.results.filter((r) => r.kind !== 'BYE_ELECTION')
  return general.at(-1) ?? null
}

/** One summary row per segment for a given election (segments without that election are skipped). */
export function segmentSummaries(segments, label) {
  return segments
    .map((segment) => {
      const record = resultFor(segment, label)
      return record ? { segment, ...summarizeElection(record) } : null
    })
    .filter(Boolean)
}

/**
 * Segments won per party in each election: { '2019': { BJP: 4, NCP: 1, ... } }.
 * Only general elections are counted so totals are comparable year to year.
 */
export function segmentsWonByParty(segments) {
  const out = {}
  for (const label of assemblyElectionLabels(segments, { includeByElections: false })) {
    const tally = {}
    for (const row of segmentSummaries(segments, label)) {
      const party = row.winner?.party
      if (party) tally[party] = (tally[party] ?? 0) + 1
    }
    out[label] = tally
  }
  return out
}

/** Vote share of one party in every segment × election (null = not listed / not contested). */
export function partyShareMatrix(segments, party, labels) {
  return segments.map((segment) => ({
    segment,
    shares: Object.fromEntries(
      labels.map((label) => {
        const r = resultFor(segment, label)
        return [label, r ? (partyShares(r).get(party) ?? null) : undefined]
      }),
    ),
  }))
}
