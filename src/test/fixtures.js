/** Small, hand-made records for unit tests. Not real election data. */

export const record = (overrides = {}) => ({
  id: 'test-2019',
  year: 2019,
  kind: 'LOK_SABHA',
  electors: 1000,
  votesPolled: 600,
  nota: 10,
  totalValidVotes: 590,
  candidates: [
    { name: 'Candidate B', party: 'INC', votes: 200 },
    { name: 'Candidate A', party: 'BJP', votes: 300 },
    { name: 'Candidate C', party: 'IND', votes: 50 },
  ],
  candidateListComplete: false,
  sources: [],
  notes: [],
  ...overrides,
})

export const lokSabhaPayload = {
  meta: { disclaimer: 'Test data' },
  elections: [
    record({ id: 'ls-2014', year: 2014, electors: 1000, votesPolled: 500, nota: 0, totalValidVotes: 500, candidates: [{ name: 'Alpha', party: 'BJP', votes: 300 }, { name: 'Beta', party: 'INC', votes: 200 }] }),
    record({ id: 'ls-2019', year: 2019, electors: 1000, votesPolled: 600, nota: 0, totalValidVotes: 600, candidates: [{ name: 'Gamma', party: 'INC', votes: 330 }, { name: 'Delta', party: 'BJP', votes: 270 }] }),
  ],
}
