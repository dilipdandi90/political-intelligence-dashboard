import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DataTable } from './DataTable'

const rows = [
  { id: 1, name: 'Kothrud', votes: 300 },
  { id: 2, name: 'Parvati', votes: null },
  { id: 3, name: 'Kasba Peth', votes: 500 },
  { id: 4, name: 'Shivajinagar', votes: 100 },
]
const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'votes', header: 'Votes', sortable: true, render: (r) => (r.votes == null ? 'N/A' : r.votes) },
]

const bodyNames = () =>
  within(screen.getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

describe('DataTable', () => {
  it('sorts descending then ascending, keeping nulls last', async () => {
    const user = userEvent.setup()
    render(<DataTable caption="Test" columns={columns} rows={rows} rowKey={(r) => r.id} />)

    await user.click(screen.getByRole('button', { name: /votes/i }))
    expect(bodyNames()).toEqual(['Kasba Peth', 'Kothrud', 'Shivajinagar', 'Parvati'])
    expect(screen.getByRole('columnheader', { name: /votes/i })).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: /votes/i }))
    expect(bodyNames()).toEqual(['Shivajinagar', 'Kothrud', 'Kasba Peth', 'Parvati'])
  })

  it('filters rows with the search box and shows an empty message', async () => {
    const user = userEvent.setup()
    render(<DataTable caption="Segments" columns={columns} rows={rows} rowKey={(r) => r.id} searchable emptyMessage="Nothing matches." />)

    await user.type(screen.getByRole('searchbox'), 'k')
    expect(bodyNames()).toEqual(['Kothrud', 'Kasba Peth'])
    expect(screen.getByText('2 of 4 rows')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('Nothing matches.')).toBeInTheDocument()
  })

  it('keeps pinned rows at the bottom in either sort direction', async () => {
    const user = userEvent.setup()
    const withOthers = [...rows, { id: 5, name: 'Others', votes: 400 }]
    render(<DataTable caption="Pinned" columns={columns} rows={withOthers} rowKey={(r) => r.id} pinBottom={(r) => r.name === 'Others'} />)

    await user.click(screen.getByRole('button', { name: /votes/i }))
    expect(bodyNames().at(-1)).toBe('Others')
    await user.click(screen.getByRole('button', { name: /votes/i }))
    expect(bodyNames().at(-1)).toBe('Others')
  })

  it('paginates', async () => {
    const user = userEvent.setup()
    render(<DataTable caption="Paged" columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={3} />)

    expect(bodyNames()).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(bodyNames()).toEqual(['Shivajinagar'])
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })
})
