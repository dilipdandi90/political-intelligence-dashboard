/**
 * Display metadata for party abbreviations that appear in the dataset.
 * Colours are chosen to be distinguishable from each other first and to echo
 * the party's usual colour second; they carry no endorsement.
 */
const PARTIES = {
  BJP: { name: 'Bharatiya Janata Party', color: '#f08a24' },
  INC: { name: 'Indian National Congress', color: '#1f77d0' },
  'INC(I)': { name: 'Indian National Congress (Indira)', color: '#1f77d0' },
  NCP: { name: 'Nationalist Congress Party', color: '#0e9384' },
  'NCP(SP)': { name: 'Nationalist Congress Party (Sharadchandra Pawar)', color: '#7a3db8' },
  SHS: { name: 'Shiv Sena', color: '#c43c2b' },
  'SHS(UBT)': { name: 'Shiv Sena (Uddhav Balasaheb Thackeray)', color: '#e0605a' },
  MNS: { name: 'Maharashtra Navnirman Sena', color: '#8a6a4f' },
  BSP: { name: 'Bahujan Samaj Party', color: '#2b3a8c' },
  'BSP(A)': { name: 'Bahujan Samaj Party (Ambedkar)', color: '#5867b5' },
  VBA: { name: 'Vanchit Bahujan Aghadi', color: '#d4a20b' },
  AAP: { name: 'Aam Aadmi Party', color: '#3c6e8f' },
  AIMIM: { name: 'All India Majlis-e-Ittehadul Muslimeen', color: '#2e7d32' },
  'RPI(A)': { name: 'Republican Party of India (Athawale)', color: '#4a5fc1' },
  'RPI(D)': { name: 'Republican Party of India (Democratic)', color: '#6d7fd6' },
  'CPI(M)': { name: 'Communist Party of India (Marxist)', color: '#b0182a' },
  BBM: { name: 'Bharipa Bahujan Mahasangh', color: '#a88a14' },
  PSP: { name: 'Praja Socialist Party', color: '#8c564b' },
  SSP: { name: 'Samyukta Socialist Party', color: '#9467bd' },
  JNP: { name: 'Janata Party', color: '#17becf' },
  PG: { name: 'PG (party label as published; expansion not verified)', color: '#7f7f7f' },
  IND: { name: 'Independent', color: '#9aa1a9' },
}

const FALLBACK_COLORS = ['#6b7280', '#8b5e3c', '#4b5563', '#a16207', '#0f766e']

export function partyName(abbr) {
  return PARTIES[abbr]?.name ?? abbr
}

export function partyColor(abbr) {
  if (PARTIES[abbr]) return PARTIES[abbr].color
  // stable fallback so an unknown party keeps the same colour everywhere
  let hash = 0
  for (const ch of abbr) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}

export const OTHERS_COLOR = '#c7ccd3'
export const NOTA_COLOR = '#5b6470'
