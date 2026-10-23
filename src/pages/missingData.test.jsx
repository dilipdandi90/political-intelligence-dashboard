/**
 * The UI must cope with missing, partial, malformed and unreachable data
 * without crashing and without showing invented values.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache } from '../api/electionApi'
import { httpError, realData, renderAt, stubFetch } from '../test/renderWithData'
import AssemblyPage from './AssemblyPage'
import LokSabhaPage from './LokSabhaPage'
import OverviewPage from './OverviewPage'

beforeEach(() => clearApiCache())
afterEach(() => vi.unstubAllGlobals())

const kpiValue = (label) => screen.getAllByText(label, { selector: 'dt' })[0].parentElement.querySelector('dd').textContent

describe('missing values', () => {
  it('shows "Not available" instead of 0 when electors and votes polled are missing', async () => {
    stubFetch({
      'lok-sabha.json': {
        elections: [
          {
            year: 2024,
            electors: null,
            votesPolled: null,
            nota: null,
            totalValidVotes: 1000,
            candidates: [
              { name: 'First', party: 'BJP', votes: 600 },
              { name: 'Second', party: 'INC', votes: 400 },
            ],
          },
        ],
      },
    })
    renderAt(<LokSabhaPage />, '/lok-sabha')

    await screen.findByRole('heading', { name: '2024 general election in detail' })
    expect(kpiValue('Voter turnout')).toBe('Not available')
    expect(kpiValue("Winner's vote share")).toBe('60.00%')
    expect(kpiValue('Winning margin')).toBe('200')
  })

  it('handles an election with a single candidate (no runner-up, no margin)', async () => {
    stubFetch({ 'lok-sabha.json': { elections: [{ year: 2014, totalValidVotes: 50, candidates: [{ name: 'Solo', party: 'IND', votes: 50 }] }] } })
    renderAt(<LokSabhaPage />, '/lok-sabha')

    await screen.findByRole('heading', { name: '2014 general election in detail' })
    expect(kpiValue('Runner-up')).toBe('Not available')
    expect(kpiValue('Winning margin')).toBe('Not available')
  })

  it('shows an empty state when the dataset has no elections', async () => {
    stubFetch({ 'lok-sabha.json': { elections: [] } })
    renderAt(<LokSabhaPage />, '/lok-sabha')
    expect(await screen.findByText('No Lok Sabha results in the dataset')).toBeInTheDocument()
  })
})

describe('invalid data', () => {
  it('drops malformed records and candidate rows but renders the rest', async () => {
    stubFetch({
      'lok-sabha.json': {
        elections: [
          { year: 'not a year', candidates: [] },
          null,
          {
            year: 2019,
            totalValidVotes: '1,000',
            candidates: [{ name: 'Valid', party: 'BJP', votes: '700' }, { name: 'Broken', party: 'INC', votes: 'lots' }, 'garbage', { name: 'Other', party: 'INC', votes: 300 }],
          },
        ],
      },
    })
    renderAt(<LokSabhaPage />, '/lok-sabha')

    const table = await screen.findByRole('region', { name: 'Candidate-wise result 2019' })
    expect(within(table).getByText('Valid')).toBeInTheDocument()
    expect(within(table).queryByText('Broken')).not.toBeInTheDocument()
    expect(kpiValue("Winner's vote share")).toBe('70.00%')
  })

  it('shows an error state when the file is not valid JSON', async () => {
    stubFetch({ 'lok-sabha.json': '{ this is not json' })
    renderAt(<LokSabhaPage />, '/lok-sabha')
    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid JSON/i)
  })

  it('shows an error state when the payload has the wrong shape', async () => {
    stubFetch({ 'assembly.json': [] })
    renderAt(<AssemblyPage />, '/assembly')
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load assembly results/i)
  })

  it('ignores unknown filter values in the URL', async () => {
    stubFetch(realData())
    renderAt(<AssemblyPage />, '/assembly?ac=999&years=1800,2024')
    // falls back to the first segment, keeps only the valid year
    expect(await screen.findByRole('heading', { name: '208 – Vadgaon Sheri' })).toBeInTheDocument()
    expect(screen.getByLabelText('2024')).toBeChecked()
    expect(screen.getByLabelText('2019')).not.toBeChecked()
  })
})

describe('unreachable data', () => {
  it('keeps the rest of the overview working when only assembly data fails, and retries', async () => {
    const data = realData()
    const fetchMock = stubFetch({ ...data, 'assembly.json': httpError(503) })
    const user = userEvent.setup()
    renderAt(<OverviewPage />)

    expect(await screen.findByText(/Assembly results could not be loaded/)).toBeInTheDocument()
    expect(screen.getByText('Registered electors (2024)')).toBeInTheDocument() // Lok Sabha part still works

    fetchMock.mockImplementation(async (url) => {
      const name = String(url).split('/').pop()
      return { ok: true, status: 200, json: async () => structuredClone(data[name]) }
    })
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Bapusaheb Tukaram Pathare')).toBeInTheDocument()
  })

  it('shows a network error message when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderAt(<LokSabhaPage />, '/lok-sabha')
    expect(await screen.findByRole('alert')).toHaveTextContent(/network error/i)
  })
})
