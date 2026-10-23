/**
 * Response shapes of the mock API (static JSON in /public/data) and the
 * normalisers that turn raw JSON into those shapes.
 *
 * Normalisers never throw on bad values: a field that is missing or not a
 * number becomes `null` ("unavailable"), and malformed candidate rows are
 * dropped. Only a payload that is not an object at all is rejected.
 *
 * @typedef {{ label: string, url?: string }} SourceRef
 * @typedef {{ name: string, party: string, votes: number }} Candidate
 *
 * @typedef {Object} ElectionRecord
 * @property {string} id
 * @property {number} year
 * @property {'LOK_SABHA' | 'VIDHAN_SABHA' | 'BYE_ELECTION'} kind
 * @property {string} [label]              e.g. "2023 (bye)"
 * @property {number | null} electors
 * @property {number | null} votesPolled   EVM + postal, includes NOTA
 * @property {number | null} [reportedTurnoutPct]  only used when votesPolled is unknown
 * @property {number | null} nota
 * @property {number | null} totalValidVotes  votes for candidates (excludes NOTA)
 * @property {Candidate[]} candidates
 * @property {boolean} candidateListComplete
 * @property {SourceRef[]} sources
 * @property {string[]} notes
 *
 * @typedef {Object} AssemblySegment
 * @property {number} acNo
 * @property {string} name
 * @property {'GEN' | 'SC' | 'ST'} reservation
 * @property {string} district
 * @property {ElectionRecord[]} results
 */

export class DataShapeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DataShapeError'
  }
}

const isObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v)

/** Accepts numbers and numeric strings like "1,23,456"; anything else → null. */
export function toNumberOrNull(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

const toText = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback)
const toArray = (v) => (Array.isArray(v) ? v : [])

function normaliseSources(raw) {
  return toArray(raw)
    .filter(isObject)
    .map((s) => ({ label: toText(s.label, 'Source'), ...(toText(s.url) ? { url: toText(s.url) } : {}) }))
}

/** @returns {Candidate[]} */
function normaliseCandidates(raw) {
  return toArray(raw)
    .filter(isObject)
    .map((c) => ({ name: toText(c.name, 'Unnamed candidate'), party: toText(c.party, 'IND'), votes: toNumberOrNull(c.votes) }))
    .filter((c) => c.votes != null && c.votes >= 0)
}

/** @returns {ElectionRecord | null} */
export function normaliseElection(raw, fallbackKind = 'LOK_SABHA') {
  if (!isObject(raw)) return null
  const year = toNumberOrNull(raw.year)
  if (year == null) return null

  const kind = ['LOK_SABHA', 'VIDHAN_SABHA', 'BYE_ELECTION'].includes(raw.kind) ? raw.kind : fallbackKind
  return {
    id: toText(raw.id, `${kind}-${year}`),
    year,
    kind,
    ...(toText(raw.label) ? { label: toText(raw.label) } : {}),
    electors: toNumberOrNull(raw.electors),
    votesPolled: toNumberOrNull(raw.votesPolled),
    reportedTurnoutPct: toNumberOrNull(raw.reportedTurnoutPct),
    nota: toNumberOrNull(raw.nota),
    totalValidVotes: toNumberOrNull(raw.totalValidVotes),
    candidates: normaliseCandidates(raw.candidates),
    candidateListComplete: raw.candidateListComplete === true,
    sources: normaliseSources(raw.sources),
    notes: toArray(raw.notes).filter((n) => typeof n === 'string'),
  }
}

export function normaliseLokSabha(raw) {
  if (!isObject(raw)) throw new DataShapeError('Lok Sabha dataset is not an object')
  return {
    meta: isObject(raw.meta) ? raw.meta : {},
    elections: toArray(raw.elections)
      .map((e) => normaliseElection(e, 'LOK_SABHA'))
      .filter(Boolean)
      .sort((a, b) => a.year - b.year),
  }
}

export function normaliseAssembly(raw) {
  if (!isObject(raw)) throw new DataShapeError('Assembly dataset is not an object')
  const segments = toArray(raw.segments)
    .filter(isObject)
    .map((s) => ({
      acNo: toNumberOrNull(s.acNo),
      name: toText(s.name, 'Unknown segment'),
      reservation: ['GEN', 'SC', 'ST'].includes(s.reservation) ? s.reservation : 'GEN',
      district: toText(s.district, '—'),
      results: toArray(s.results)
        .map((r) => normaliseElection(r, 'VIDHAN_SABHA'))
        .filter(Boolean)
        .sort((a, b) => a.year - b.year),
    }))
    .filter((s) => s.acNo != null)
    .sort((a, b) => a.acNo - b.acNo)
  return { meta: isObject(raw.meta) ? raw.meta : {}, segments }
}

const CENSUS_KEYS = [
  'population', 'males', 'females', 'sexRatio', 'child0to6', 'rural', 'urban', 'literacyRate', 'literacyMale',
  'literacyFemale', 'scPopulation', 'stPopulation', 'areaKm2', 'densityPerKm2', 'decadalGrowthPct',
]

export function normaliseConstituency(raw) {
  if (!isObject(raw)) throw new DataShapeError('Constituency profile is not an object')
  return {
    meta: isObject(raw.meta) ? raw.meta : {},
    pcNo: toNumberOrNull(raw.pcNo),
    name: toText(raw.name, 'Unknown constituency'),
    state: toText(raw.state, '—'),
    reservation: toText(raw.reservation, 'GEN'),
    districts: toArray(raw.districts).filter((d) => typeof d === 'string'),
    coverage: toText(raw.coverage),
    delimitationNote: toText(raw.delimitationNote),
    segments: toArray(raw.segments)
      .filter(isObject)
      .map((s) => ({ acNo: toNumberOrNull(s.acNo), name: toText(s.name), reservation: toText(s.reservation, 'GEN'), extent: toText(s.extent) })),
    segmentNotes: toArray(raw.segmentNotes).filter((n) => typeof n === 'string'),
    members: toArray(raw.members)
      .filter(isObject)
      .map((m) => ({ year: toNumberOrNull(m.year), name: toText(m.name, '—'), party: toText(m.party, '—') }))
      .filter((m) => m.year != null),
    membersNote: toText(raw.membersNote),
    demographics: toArray(raw.demographics)
      .filter(isObject)
      .map((d) => ({
        id: toText(d.id, toText(d.title)),
        title: toText(d.title, 'Untitled dataset'),
        geography: toText(d.geography),
        referenceYear: toNumberOrNull(d.referenceYear),
        figures: Object.fromEntries(CENSUS_KEYS.map((k) => [k, toNumberOrNull(d.figures?.[k])])),
        sources: normaliseSources(d.sources),
        notes: toArray(d.notes).filter((n) => typeof n === 'string'),
      })),
    demographicsNote: toText(raw.demographicsNote),
    sources: normaliseSources(raw.sources),
  }
}
