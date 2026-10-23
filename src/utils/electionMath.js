

/**
 * @param {number | null | undefined} part
 * @param {number | null | undefined} whole
 * @returns {number | null}
 */
export function percent(part, whole) {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) {
    return null
  }
  return (part / whole) * 100
}

/** @param {import('../api/schema').Candidate[]} candidates */
export function sumVotes(candidates) {
  return candidates.reduce((total, c) => total + c.votes, 0)
}

/**
 * Denominator for vote share and margin %.
 * Uses the figure reported by the source; falls back to summing candidate votes
 * only when we hold the complete candidate list (otherwise the sum is too low).
 * @param {import('../api/schema').ElectionRecord} record
 */
export function totalValidVotes(record) {
  if (record.totalValidVotes != null) return record.totalValidVotes
  if (record.candidateListComplete && record.candidates.length > 0) return sumVotes(record.candidates)
  return null
}

/**
 * Votes polled by candidates not individually listed in our dataset.
 * @param {import('../api/schema').ElectionRecord} record
 */
export function unlistedVotes(record) {
  const valid = totalValidVotes(record)
  if (valid == null) return null
  return Math.max(valid - sumVotes(record.candidates), 0)
}

/**
 * Candidates sorted by votes with derived fields.
 * A candidate forfeits the security deposit when polling less than one-sixth of
 * the total valid votes (Representation of the People Act 1951, s.158).
 * @param {import('../api/schema').ElectionRecord} record
 */
export function rankCandidates(record) {
  const valid = totalValidVotes(record)
  return [...record.candidates]
    .sort((a, b) => b.votes - a.votes)
    .map((c, i) => ({
      ...c,
      rank: i + 1,
      voteShare: percent(c.votes, valid),
      isWinner: i === 0,
      forfeitedDeposit: valid == null ? null : c.votes < valid / 6,
    }))
}

/**
 * One-stop summary used by KPI cards, tables and trend charts.
 * @param {import('../api/schema').ElectionRecord} record
 */
export function summarizeElection(record) {
  const ranked = rankCandidates(record)
  const winner = ranked[0] ?? null
  const runnerUp = ranked[1] ?? null
  const validVotes = totalValidVotes(record)
  const marginVotes = winner && runnerUp ? winner.votes - runnerUp.votes : null
  const computedTurnout = percent(record.votesPolled, record.electors)
  const reportedTurnout = record.reportedTurnoutPct ?? null

  return {
    record,
    label: electionLabel(record),
    winner,
    runnerUp,
    validVotes,
    /** Winner's votes − runner-up's votes */
    marginVotes,
    /** Margin ÷ total valid votes × 100 */
    marginPct: percent(marginVotes, validVotes),
    /** Votes polled ÷ registered electors × 100, or the source's own figure when we can't compute it */
    turnoutPct: computedTurnout ?? reportedTurnout,
    turnoutBasis: computedTurnout != null ? 'computed' : reportedTurnout != null ? 'reported' : null,
    /** NOTA ÷ (valid votes + NOTA) × 100 */
    notaPct: record.nota == null ? null : percent(record.nota, (validVotes ?? 0) + record.nota),
    othersVotes: unlistedVotes(record),
  }
}

/**
 * Party-wise vote share for one election. Candidates of the same party are
 * summed (in practice only independents, grouped under "IND").
 * @param {import('../api/schema').ElectionRecord} record
 * @returns {Map<string, number | null>}
 */
export function partyShares(record) {
  const valid = totalValidVotes(record)
  const votesByParty = new Map()
  for (const c of record.candidates) {
    votesByParty.set(c.party, (votesByParty.get(c.party) ?? 0) + c.votes)
  }
  const shares = new Map()
  for (const [party, votes] of votesByParty) shares.set(party, percent(votes, valid))
  return shares
}

/**
 * Chart rows like `{ year: '2019', BJP: 61.3, INC: 30.9 }`.
 * A party absent from a year gets `null` (didn't contest, or not among the
 * listed candidates) so charts show a gap rather than a false zero.
 * @param {import('../api/schema').ElectionRecord[]} records
 * @param {string[]} parties
 */
export function partyShareRows(records, parties) {
  return sortByYear(records).map((r) => {
    const shares = partyShares(r)
    const row = { year: electionLabel(r) }
    for (const p of parties) row[p] = shares.get(p) ?? null
    return row
  })
}

/**
 * Parties ordered by their best vote share across the given elections.
 * @param {import('../api/schema').ElectionRecord[]} records
 * @param {number} [minShare] ignore parties that never reached this share
 */
export function leadingParties(records, minShare = 5) {
  const best = new Map()
  for (const r of records) {
    for (const [party, share] of partyShares(r)) {
      if (share == null) continue
      best.set(party, Math.max(best.get(party) ?? 0, share))
    }
  }
  return [...best.entries()]
    .filter(([, share]) => share >= minShare)
    .sort((a, b) => b[1] - a[1])
    .map(([party]) => party)
}

/**
 * Change in a party's vote share between consecutive elections (percentage points).
 * @param {import('../api/schema').ElectionRecord[]} records
 * @param {string} party
 */
export function partySwings(records, party) {
  const sorted = sortByYear(records)
  const swings = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const previousShare = partyShares(prev).get(party) ?? null
    const currentShare = partyShares(curr).get(party) ?? null
    swings.push({
      party,
      from: electionLabel(prev),
      to: electionLabel(curr),
      previousShare,
      currentShare,
      swing: previousShare != null && currentShare != null ? currentShare - previousShare : null,
    })
  }
  return swings
}

/** @param {import('../api/schema').ElectionRecord} record */
export function electionLabel(record) {
  return record.label ?? String(record.year)
}

/** @param {import('../api/schema').ElectionRecord[]} records */
export function sortByYear(records) {
  // by-elections share a year with nothing else here, but keep general elections first if they ever do
  return [...records].sort((a, b) => a.year - b.year || (a.kind === 'BYE_ELECTION') - (b.kind === 'BYE_ELECTION'))
}
