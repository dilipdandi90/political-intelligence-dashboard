/** Groups the filters of a page; sticks under the header on wide screens. */
export function FilterBar({ children, label = 'Filters' }) {
  return (
    <div className="filter-bar" role="group" aria-label={label}>
      {children}
    </div>
  )
}
