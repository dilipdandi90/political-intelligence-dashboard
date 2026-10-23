import { describe, expect, it } from 'vitest'
import { record } from '../test/fixtures'
import {
  leadingParties,
  partyShareRows,
  partySwings,
  percent,
  rankCandidates,
  summarizeElection,
  totalValidVotes,
  unlistedVotes,
} from './electionMath'

describe('percent', () => {
  it('divides and scales to 100', () => {
    expect(percent(25, 200)).toBe(12.5)
  })

  it.each([
    [null, 100],
    [10, null],
    [10, 0],
    [10, -5],
    [Number.NaN, 100],
  ])('returns null for unusable input (%s / %s)', (part, whole) => {
    expect(percent(part, whole)).toBeNull()
  })
})

describe('totalValidVotes', () => {
  it('prefers the figure reported by the source', () => {
    expect(totalValidVotes(record())).toBe(590)
  })

  it('sums candidates only when the list is complete', () => {
    expect(totalValidVotes(record({ totalValidVotes: null, candidateListComplete: true }))).toBe(550)
    expect(totalValidVotes(record({ totalValidVotes: null, candidateListComplete: false }))).toBeNull()
  })

  it('reports votes of candidates not listed individually', () => {
    expect(unlistedVotes(record())).toBe(40)
  })
})

describe('rankCandidates', () => {
  it('orders by votes and computes share against total valid votes', () => {
    const ranked = rankCandidates(record())
    expect(ranked.map((c) => c.name)).toEqual(['Candidate A', 'Candidate B', 'Candidate C'])
    expect(ranked[0].isWinner).toBe(true)
    expect(ranked[0].voteShare).toBeCloseTo((300 / 590) * 100, 6)
  })

  it('flags deposit forfeiture below one-sixth of valid votes', () => {
    const ranked = rankCandidates(record())
    expect(ranked[1].forfeitedDeposit).toBe(false) // 200 ≥ 98.33
    expect(ranked[2].forfeitedDeposit).toBe(true) // 50 < 98.33
  })

  it('does not mutate the input', () => {
    const r = record()
    rankCandidates(r)
    expect(r.candidates[0].name).toBe('Candidate B')
  })
})

describe('summarizeElection', () => {
  it('computes margin, margin % and turnout with the right denominators', () => {
    const s = summarizeElection(record())
    expect(s.marginVotes).toBe(100)
    expect(s.marginPct).toBeCloseTo((100 / 590) * 100, 6)
    expect(s.turnoutPct).toBe(60)
    expect(s.turnoutBasis).toBe('computed')
    expect(s.notaPct).toBeCloseTo((10 / 600) * 100, 6)
  })

  it('falls back to the reported turnout when electors are unknown', () => {
    const s = summarizeElection(record({ electors: null, reportedTurnoutPct: 49.89 }))
    expect(s.turnoutPct).toBe(49.89)
    expect(s.turnoutBasis).toBe('reported')
  })

  it('returns nulls rather than zeros when inputs are missing', () => {
    const s = summarizeElection(record({ electors: null, votesPolled: null, nota: null, candidates: [{ name: 'Only', party: 'X', votes: 5 }] }))
    expect(s.turnoutPct).toBeNull()
    expect(s.turnoutBasis).toBeNull()
    expect(s.notaPct).toBeNull()
    expect(s.runnerUp).toBeNull()
    expect(s.marginVotes).toBeNull()
  })

  it('handles an election with no candidates without throwing', () => {
    const s = summarizeElection(record({ candidates: [] }))
    expect(s.winner).toBeNull()
    expect(s.marginPct).toBeNull()
  })
})

describe('party trends', () => {
  const a = record({ id: 'a', year: 2014, totalValidVotes: 100, candidates: [{ name: 'x', party: 'BJP', votes: 60 }, { name: 'y', party: 'INC', votes: 40 }] })
  const b = record({ id: 'b', year: 2019, totalValidVotes: 100, candidates: [{ name: 'x', party: 'BJP', votes: 55 }, { name: 'z', party: 'VBA', votes: 45 }] })

  it('builds chart rows with null for parties absent that year', () => {
    const rows = partyShareRows([b, a], ['BJP', 'INC'])
    expect(rows.map((r) => r.year)).toEqual(['2014', '2019']) // sorted chronologically
    expect(rows[0]).toEqual({ year: '2014', BJP: 60, INC: 40 })
    expect(rows[1].BJP).toBeCloseTo(55, 9)
    expect(rows[1].INC).toBeNull()
  })

  it('computes swing in percentage points between consecutive elections', () => {
    const [swing] = partySwings([a, b], 'BJP')
    expect(swing.swing).toBeCloseTo(-5, 6)
    expect(partySwings([a, b], 'INC')[0].swing).toBeNull()
  })

  it('ranks parties by best share and drops minor ones', () => {
    expect(leadingParties([a, b], 41)).toEqual(['BJP', 'VBA'])
  })

  it('combines independents into one IND share', () => {
    const r = record({ totalValidVotes: 100, candidates: [{ name: 'p', party: 'IND', votes: 10 }, { name: 'q', party: 'IND', votes: 15 }] })
    expect(partyShareRows([r], ['IND'])[0].IND).toBe(25)
  })
})
