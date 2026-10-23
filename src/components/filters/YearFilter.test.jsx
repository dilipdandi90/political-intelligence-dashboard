import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { YearFilter } from './YearFilter'

const options = ['2009', '2014', '2019', '2024'].map((y) => ({ value: y, label: y }))

describe('YearFilter', () => {
  it('toggles years and keeps them in chronological order', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<YearFilter options={options} selected={['2024']} onChange={onChange} />)

    await user.click(screen.getByLabelText('2009'))
    expect(onChange).toHaveBeenLastCalledWith(['2009', '2024'])

    await user.click(screen.getByLabelText('2024'))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('offers select-all and clear shortcuts', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<YearFilter options={options} selected={['2014']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onChange).toHaveBeenLastCalledWith(['2009', '2014', '2019', '2024'])
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('is keyboard operable', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<YearFilter options={options} selected={[]} onChange={onChange} />)

    await user.tab()
    expect(screen.getByLabelText('2009')).toHaveFocus()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith(['2009'])
  })
})
