/**
 * Guards the shipped JSON files: if someone edits a vote count by hand, these
 * checks catch totals that no longer reconcile.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normaliseAssembly, normaliseConstituency, normaliseLokSabha } from '../api/schema'
import { sumVotes, summarizeElection } from '../utils/electionMath'

const load = (file) => JSON.parse(readFileSync(resolve(__dirname, '../../public/data', file), 'utf8'))

const lokSabha = normaliseLokSabha(load('lok-sabha.json'))
const assembly = normaliseAssembly(load('assembly.json'))
const profile = normaliseConstituency(load('constituency.json'))
const allRecords = [...lokSabha.elections, ...assembly.segments.flatMap((s) => s.results)]

describe('shipped datasets', () => {
  it('cover the four post-delimitation Lok Sabha elections', () => {
    expect(lokSabha.elections.map((e) => e.year)).toEqual([2009, 2014, 2019, 2024])
  })

  it('contain the six assembly segments listed in the profile', () => {
    expect(assembly.segments.map((s) => s.acNo)).toEqual(profile.segments.map((s) => s.acNo))
  })

  it.each(allRecords.map((r) => [r.id, r]))('%s: listed candidates never exceed total valid votes', (_id, r) => {
    expect(sumVotes(r.candidates)).toBeLessThanOrEqual(r.totalValidVotes)
  })

  it.each(allRecords.filter((r) => r.votesPolled != null).map((r) => [r.id, r]))(
    '%s: votes polled ≥ valid votes + NOTA',
    (_id, r) => {
      expect(r.votesPolled).toBeGreaterThanOrEqual(r.totalValidVotes + (r.nota ?? 0))
    },
  )

  it.each(allRecords.map((r) => [r.id, r]))('%s: every record cites at least one source', (_id, r) => {
    expect(r.sources.length).toBeGreaterThan(0)
  })

  it('reproduces published margins', () => {
    const margin = (id) => summarizeElection(allRecords.find((r) => r.id === id)).marginVotes
    expect(margin('ls-2024')).toBe(123038)
    expect(margin('ls-2019')).toBe(324628)
    expect(margin('ls-2009')).toBe(25701)
    expect(margin('ac210-2024')).toBe(112041)
    expect(margin('ac215-2023-bye')).toBe(10915)
  })

  it('census totals add up', () => {
    for (const d of profile.demographics) {
      const f = d.figures
      if (f.males != null && f.females != null) expect(f.males + f.females).toBe(f.population)
      if (f.rural != null && f.urban != null) expect(f.rural + f.urban).toBe(f.population)
    }
  })
})
