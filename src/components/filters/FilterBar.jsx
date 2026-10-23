/** Groups the filters of a page in one bordered strip. */
export function FilterBar({ children, label = 'Filters' }) {
  return (
    <div
      className="mb-1 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-4 py-3"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
