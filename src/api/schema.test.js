import { describe, expect, it } from 'vitest'
import { DataShapeError, normaliseAssembly, normaliseConstituency, normaliseElection, normaliseLokSabha, toNumberOrNull } from './schema'

describe('toNumberOrNull', () => {
  it('accepts numbers and Indian-formatted numeric strings', () => {
    expect(toNumberOrNull(42)).toBe(42)
    expect(toNumberOrNull('12,34,567')).toBe(1234567)
  })

  it.each([undefined, null, '', 'abc', NaN, Infinity, {}, []])('maps %s to null', (v) => {
    expect(toNumberOrNull(v)).toBeNull()
  })
})

describe('normaliseElection', () => {
  it('turns missing numeric fields into null instead of 0', () => {
    const r = normaliseElection({ year: 2019, candidates: [] })
    expect(r.electors).toBeNull()
    expect(r.votesPolled).toBeNull()
    expect(r.nota).toBeNull()
    expect(r.totalValidVotes).toBeNull()
  })

  it('drops malformed candidate rows and fills safe defaults', () => {
    const r = normaliseElection({
      year: '2024',
      candidates: [{ name: 'Ok', party: 'BJP', votes: '1,000' }, { name: 'Bad', votes: 'lots' }, null, { votes: 5 }],
    })
    expect(r.year).toBe(2024)
    expect(r.candidates).toEqual([
      { name: 'Ok', party: 'BJP', votes: 1000 },
      { name: 'Unnamed candidate', party: 'IND', votes: 5 },
    ])
  })

  it('rejects records without a usable year', () => {
    expect(normaliseElection({ candidates: [] })).toBeNull()
    expect(normaliseElection('nope')).toBeNull()
  })
})

describe('dataset normalisers', () => {
  it('throws a DataShapeError when the payload is not an object', () => {
    expect(() => normaliseLokSabha(null)).toThrow(DataShapeError)
    expect(() => normaliseAssembly([])).toThrow(DataShapeError)
    expect(() => normaliseConstituency('x')).toThrow(DataShapeError)
  })

  it('tolerates missing arrays and sorts by year / AC number', () => {
    expect(normaliseLokSabha({}).elections).toEqual([])
    const ls = normaliseLokSabha({ elections: [{ year: 2019 }, { year: 2009 }, { bogus: true }] })
    expect(ls.elections.map((e) => e.year)).toEqual([2009, 2019])

    const ac = normaliseAssembly({ segments: [{ acNo: 215, name: 'B' }, { acNo: 208, name: 'A' }, { name: 'no number' }] })
    expect(ac.segments.map((s) => s.acNo)).toEqual([208, 215])
  })

  it('keeps unknown census figures as null', () => {
    const p = normaliseConstituency({ demographics: [{ title: 'X', referenceYear: 2011, figures: { population: 10 } }] })
    expect(p.demographics[0].figures.population).toBe(10)
    expect(p.demographics[0].figures.scPopulation).toBeNull()
  })
})
