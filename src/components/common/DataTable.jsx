import { useId, useMemo, useState } from 'react'
import { cx } from '../../utils/cx'
import { Button } from '../ui'

/**
 * Generic table with optional search, column sorting and pagination.
 *
 * columns: [{
 *   key: string,
 *   header: string,
 *   render?: (row) => ReactNode,       // defaults to row[key]
 *   sortValue?: (row) => string|number|null, // enables sorting; defaults to row[key] when `sortable`
 *   sortable?: boolean,
 *   align?: 'left' | 'right',
 * }]
 *
 * pinBottom: (row) => boolean – rows that always stay at the end (e.g. "Others"),
 * whatever the sort order.
 *
 * Nulls always sort last regardless of direction, so "N/A" rows never jump to
 * the top of a descending sort.
 *
 * Below the `sm` breakpoint the same markup is restyled as stacked cards: the
 * header row is hidden, each row becomes a block, and every cell shows its
 * column name (from data-label) next to the value. Sorting moves to a select.
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  caption,
  searchable = false,
  searchPlaceholder = 'Search…',
  searchText = (row) => Object.values(row).join(' '),
  pageSize = 0,
  initialSort,
  emptyMessage = 'No rows to show.',
  rowClassName,
  pinBottom,
}) {
  const searchId = useId()
  const sortId = useId()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(initialSort ?? null) // { key, dir: 'asc' | 'desc' }
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => searchText(r).toLowerCase().includes(q))
  }, [rows, query, searchText])

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key)
    const get = col ? (col.sortValue ?? ((r) => r[col.key])) : null
    const dir = sort?.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (pinBottom) {
        const pa = pinBottom(a) ? 1 : 0
        const pb = pinBottom(b) ? 1 : 0
        if (pa !== pb) return pa - pb
      }
      if (!get) return 0
      const va = get(a)
      const vb = get(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'en', { numeric: true }) * dir
    })
  }, [filtered, sort, columns, pinBottom])

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const currentPage = Math.min(page, pageCount - 1)
  const visible = pageSize > 0 ? sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : sorted

  function toggleSort(key) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'desc' }
      return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
    })
    setPage(0)
  }

  const isSortable = (c) => c.sortable || c.sortValue
  const sortableColumns = columns.filter(isSortable)

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {(searchable || sortableColumns.length > 0) && (
        <div className={cx('flex flex-wrap items-center gap-x-3 gap-y-2', !searchable && 'sm:hidden')}>
          {searchable && (
            <>
          <label htmlFor={searchId} className="sr-only">
            Search {caption ?? 'table'}
          </label>
          <input
            id={searchId}
            type="search"
            className="min-h-10 max-w-85 min-w-0 flex-[1_1_220px] rounded-lg border border-line bg-surface px-2.5 py-2 max-sm:max-w-none"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
          <span className="text-[13px] text-muted" aria-live="polite">
            {filtered.length} of {rows.length} rows
          </span>
            </>
          )}
          {sortableColumns.length > 0 && (
            <div className="flex w-full items-center gap-2 sm:hidden">
              <label htmlFor={sortId} className="shrink-0 text-[13px] font-semibold text-muted">
                Sort by
              </label>
              <select
                id={sortId}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-2"
                value={sort ? `${sort.key}:${sort.dir}` : ''}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split(':')
                  setSort(key ? { key, dir } : null)
                  setPage(0)
                }}
              >
                {!sort && <option value="">Default order</option>}
                {sortableColumns.flatMap((c) => [
                  <option key={`${c.key}:desc`} value={`${c.key}:desc`}>
                    {c.header} (high → low)
                  </option>,
                  <option key={`${c.key}:asc`} value={`${c.key}:asc`}>
                    {c.header} (low → high)
                  </option>,
                ])}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-line" tabIndex={0} role="region" aria-label={caption ?? 'Data table'}>
        <table className="w-full border-collapse text-sm tabular-nums max-sm:block">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="max-sm:hidden">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key
                const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cx(
                      'sticky top-0 border-b border-line bg-surface-2 px-3 py-2 text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase',
                      c.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {isSortable(c) ? (
                      <button
                        type="button"
                        className={cx('inline-flex w-full cursor-pointer items-center gap-1 uppercase', c.align === 'right' && 'justify-end')}
                        onClick={() => toggleSort(c.key)}
                      >
                        {c.header}
                        <span className="text-[0.7rem] opacity-70" aria-hidden="true">
                          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="max-sm:block">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-5 text-center text-muted max-sm:block">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={rowKey ? rowKey(row) : i} className={cx('border-b border-line last:border-b-0 hover:bg-hover max-sm:block max-sm:py-2', rowClassName?.(row))}>
                  {columns.map((c, ci) => (
                    <td
                      key={c.key}
                      data-label={c.header}
                      className={cx(
                        'px-3 py-2.5 align-top',
                        c.align === 'right' && 'text-right whitespace-nowrap',
                        // phones: first cell is the card heading, the rest are "label … value" lines
                        ci === 0
                          ? 'max-sm:block max-sm:py-1 max-sm:text-left max-sm:text-[15px] max-sm:font-semibold'
                          : 'max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1 max-sm:text-right max-sm:whitespace-normal max-sm:before:max-w-[45%] max-sm:before:shrink-0 max-sm:before:text-left max-sm:before:text-[13px] max-sm:before:font-normal max-sm:before:text-muted max-sm:before:content-[attr(data-label)]',
                      )}
                    >
                      {/* one wrapper so mixed content (text + tags) stays a single flex item in the phone layout */}
                      <span className="max-sm:min-w-0">{c.render ? c.render(row) : row[c.key]}</span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && sorted.length > pageSize && (
        <nav className="flex items-center justify-end gap-3 text-sm max-sm:justify-between" aria-label={`${caption ?? 'Table'} pages`}>
          <Button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
            Previous
          </Button>
          <span aria-live="polite">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}>
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
