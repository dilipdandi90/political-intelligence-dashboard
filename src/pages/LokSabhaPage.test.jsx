import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearApiCache } from '../api/electionApi'
import { lokSabhaPayload } from '../test/fixtures'
import LokSabhaPage from './LokSabhaPage'

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body })

function renderPage(url = '/lok-sabha') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LokSabhaPage />
    </MemoryRouter>,
  )
}

describe('LokSabhaPage', () => {
  beforeEach(() => clearApiCache())
  afterEach(() => vi.unstubAllGlobals())

  it('shows a loading state, then the results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(lokSabhaPayload)))
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
    expect(await screen.findByRole('heading', { name: /2019 general election in detail/i })).toBeInTheDocument()
  })

  it('updates the comparison table when years are toggled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(lokSabhaPayload)))
    const user = userEvent.setup()
    renderPage()

    const table = await screen.findByRole('region', { name: 'Lok Sabha results by year' })
    expect(within(table).getAllByRole('row')).toHaveLength(3) // header + 2 years

    await user.click(screen.getByLabelText('2014'))
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    expect(within(table).queryByText('Alpha')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('No election years selected')).toBeInTheDocument()
  })

  it('restores filters from the URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(lokSabhaPayload)))
    renderPage('/lok-sabha?years=2014&focus=2014')

    expect(await screen.findByRole('heading', { name: /2014 general election in detail/i })).toBeInTheDocument()
    expect(screen.getByLabelText('2019')).not.toBeChecked()
  })

  it('shows an error with a working retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce(okResponse(lokSabhaPayload))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not load lok sabha results/i)
    expect(alert).toHaveTextContent(/HTTP 500/)

    await user.click(within(alert).getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: /2019 general election in detail/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
