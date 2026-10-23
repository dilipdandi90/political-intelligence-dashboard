/**
 * Integration tests: every page rendered with the REAL dataset from
 * public/data, exercising filters and checking that tables, charts and KPI
 * cards update together.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache } from '../api/electionApi'
import { realData, renderAt, stubFetch } from '../test/renderWithData'
import AssemblyPage from './AssemblyPage'
import DataSourcesPage from './DataSourcesPage'
import LokSabhaPage from './LokSabhaPage'
import OverviewPage from './OverviewPage'
import TrendsPage from './TrendsPage'

/** Finds a KPI card by its label and returns the text of its value. */
function kpiValue(label) {
  const term = screen.getAllByText(label, { selector: 'dt' })[0]
  return term.parentElement.querySelector('.kpi__value').textContent
}

beforeEach(() => {
  clearApiCache()
  stubFetch(realData())
})
afterEach(() => vi.unstubAllGlobals())

describe('Overview page (real data)', () => {
  it('renders constituency facts, segments and census figures', async () => {
    renderAt(<OverviewPage />)

    expect(await screen.findByText('Registered electors (2024)')).toBeInTheDocument()
    expect(kpiValue('Registered electors (2024)')).toBe('20,61,276')
    expect(kpiValue('Sitting MP')).toBe('Murlidhar Mohol')
    expect(kpiValue('PC number')).toBe('34')

    const segments = await screen.findByRole('region', { name: 'Assembly segments of Pune PC' })
    for (const name of ['Vadgaon Sheri', 'Shivajinagar', 'Kothrud', 'Parvati', 'Pune Cantonment', 'Kasba Peth']) {
      expect(within(segments).getByText(name)).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'Demographic profile (Census 2011)' })).toBeInTheDocument()
    expect(kpiValue('Population (2011)')).toBe('94,29,408')
  })

  it('switching geography updates the census KPIs and marks unavailable data', async () => {
    const user = userEvent.setup()
    renderAt(<OverviewPage />)

    await screen.findByText('Population (2011)')
    await user.selectOptions(screen.getByLabelText('Geography'), 'pmc-2011')

    expect(kpiValue('Population (2011)')).toBe('31,24,458')
    expect(kpiValue('Sex ratio')).toBe('948')
    // SC/ST shares for PMC could not be verified, so they must say so rather than show 0
    expect(kpiValue('SC population')).toBe('Not available')
    expect(kpiValue('ST population')).toBe('Not available')
  })
})

describe('Lok Sabha page (real data)', () => {
  it('shows the correct 2024 result with computed vote share and margin', async () => {
    renderAt(<LokSabhaPage />, '/lok-sabha')

    await screen.findByRole('heading', { name: '2024 general election in detail' })
    expect(kpiValue('Winner')).toBe('Murlidhar Mohol')
    expect(kpiValue("Winner's vote share")).toBe('53.30%') // 584728 / 1097112
    expect(kpiValue('Winning margin')).toBe('1,23,038') // 584728 − 461690
    expect(screen.getByText('11.21% of valid votes')).toBeInTheDocument()
    expect(kpiValue('Voter turnout')).toBe('53.59%') // 1104572 / 2061276
  })

  it('changing the focus year updates the KPI cards and candidate table', async () => {
    const user = userEvent.setup()
    renderAt(<LokSabhaPage />, '/lok-sabha')

    await screen.findByRole('heading', { name: '2024 general election in detail' })
    await user.selectOptions(screen.getByLabelText('Inspect year in detail'), '2009')

    expect(screen.getByRole('heading', { name: '2009 general election in detail' })).toBeInTheDocument()
    expect(kpiValue('Winner')).toBe('Suresh Kalmadi')
    expect(kpiValue('Winning margin')).toBe('25,701')
    const candidates = screen.getByRole('region', { name: 'Candidate-wise result 2009' })
    expect(within(candidates).getByText('Anil Shirole')).toBeInTheDocument()
    // NOTA did not exist in 2009
    expect(screen.getByText('Not applicable (before 2013)')).toBeInTheDocument()
  })

  it('2019 turnout falls back to the reported figure because electors are unavailable', async () => {
    renderAt(<LokSabhaPage />, '/lok-sabha?focus=2019')

    await screen.findByRole('heading', { name: '2019 general election in detail' })
    expect(kpiValue('Voter turnout')).toBe('49.89%')
    expect(screen.getByText(/Reported by source/)).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Lok Sabha results by year' })
    expect(within(summary).getByText('N/A')).toBeInTheDocument() // 2019 electors
  })

  it('deselecting a year removes it from the comparison table', async () => {
    const user = userEvent.setup()
    renderAt(<LokSabhaPage />, '/lok-sabha')

    const table = await screen.findByRole('region', { name: 'Lok Sabha results by year' })
    expect(within(table).getAllByRole('row')).toHaveLength(5)
    await user.click(screen.getByLabelText('2009'))
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(within(table).queryByText('Suresh Kalmadi')).not.toBeInTheDocument()
  })
})

describe('Assembly page (real data)', () => {
  it('selecting a segment updates the results table and KPIs', async () => {
    const user = userEvent.setup()
    renderAt(<AssemblyPage />, '/assembly')

    expect(await screen.findByRole('heading', { name: '208 – Vadgaon Sheri' })).toBeInTheDocument()
    expect(kpiValue('Winner')).toBe('Bapusaheb Tukaram Pathare')

    await user.selectOptions(screen.getByLabelText('Assembly constituency'), '210')
    expect(screen.getByRole('heading', { name: '210 – Kothrud' })).toBeInTheDocument()
    expect(kpiValue('Winner')).toBe('Chandrakant Bachhu Patil')
    expect(kpiValue('Winning margin')).toBe('1,12,041')
  })

  it('tells the user when a segment has no result for a selected year', async () => {
    renderAt(<AssemblyPage />, '/assembly?ac=210')

    await screen.findByRole('heading', { name: '210 – Kothrud' })
    // the 2023 by-election only happened in Kasba Peth
    expect(screen.getByRole('note')).toHaveTextContent('No result for Kothrud in: 2023 (bye)')
  })

  it('the year filter changes which elections are listed', async () => {
    const user = userEvent.setup()
    renderAt(<AssemblyPage />, '/assembly?ac=215')

    const table = await screen.findByRole('region', { name: 'Kasba Peth results by election' })
    expect(within(table).getAllByRole('row')).toHaveLength(6) // header + 5 elections
    await user.click(screen.getByLabelText('2023 (bye)'))
    expect(within(table).getAllByRole('row')).toHaveLength(5)
  })

  it('comparison year select updates the cross-segment table', async () => {
    const user = userEvent.setup()
    renderAt(<AssemblyPage />, '/assembly')

    const table = await screen.findByRole('region', { name: 'Assembly segment outcomes 2024' })
    expect(within(table).getByText('Hemant Narayan Rasane')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Vidhan Sabha election'), '2009')
    const table2009 = screen.getByRole('region', { name: 'Assembly segment outcomes 2009' })
    expect(within(table2009).getByText('Girish Bapat')).toBeInTheDocument()
  })
})

describe('Trends page (real data)', () => {
  it('lists the formulas and computes the swing for the chosen party', async () => {
    const user = userEvent.setup()
    renderAt(<TrendsPage />, '/trends')

    expect(screen.getByText('Candidate votes ÷ Total valid votes × 100')).toBeInTheDocument()
    const swing = await screen.findByRole('region', { name: 'BJP swing' })
    // 2019 → 2024: 53.30% − 61.79%
    expect(within(swing).getByText('−8.49 pp')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Party for swing analysis'), 'INC')
    expect(screen.getByRole('region', { name: 'INC swing' })).toBeInTheDocument()
  })
})

describe('Data & methodology page (real data)', () => {
  it('lists the sources referenced by the datasets', async () => {
    renderAt(<DataSourcesPage />, '/data')
    expect(await screen.findByRole('link', { name: 'Wikipedia – Pune Lok Sabha constituency (cites ECI)' })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Pune_Lok_Sabha_constituency',
    )
  })
})
