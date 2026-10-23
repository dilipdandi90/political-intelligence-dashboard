import { useId, useMemo, useState } from 'react'

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

  return (
    <div className="data-table">
      {searchable && (
        <div className="data-table__toolbar">
          <label htmlFor={searchId} className="visually-hidden">
            Search {caption ?? 'table'}
          </label>
          <input
            id={searchId}
            type="search"
            className="input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
          <span className="data-table__count" aria-live="polite">
            {filtered.length} of {rows.length} rows
          </span>
        </div>
      )}

      <div className="table-scroll" tabIndex={0} role="region" aria-label={caption ?? 'Data table'}>
        <table>
          {caption && <caption className="visually-hidden">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key
                const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                return (
                  <th key={c.key} scope="col" aria-sort={ariaSort} className={c.align === 'right' ? 'num' : undefined}>
                    {isSortable(c) ? (
                      <button type="button" className="sort-btn" onClick={() => toggleSort(c.key)}>
                        {c.header}
                        <span className="sort-btn__icon" aria-hidden="true">
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
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={rowKey ? rowKey(row) : i} className={rowClassName?.(row)}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === 'right' ? 'num' : undefined} data-label={c.header}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && sorted.length > pageSize && (
        <nav className="pagination" aria-label={`${caption ?? 'Table'} pages`}>
          <button type="button" className="btn" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>
            Previous
          </button>
          <span aria-live="polite">
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pageCount - 1}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}
