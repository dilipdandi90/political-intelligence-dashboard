import { useId } from 'react'

/**
 * Multi-select of election years rendered as toggle chips (real checkboxes
 * underneath, so it works with keyboard and screen readers).
 *
 * options: [{ value: '2019', label: '2019' }]
 */
export function YearFilter({ legend = 'Election years', options, selected, onChange, minSelected = 0 }) {
  const id = useId()
  const toggle = (value) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    if (next.length < minSelected) return
    // keep chronological order regardless of click order
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)))
  }

  return (
    <fieldset className="filter chip-filter">
      <legend className="filter__label">{legend}</legend>
      <div className="chip-filter__chips">
        {options.map((o) => {
          const checked = selected.includes(o.value)
          const inputId = `${id}-${o.value}`
          return (
            <span key={o.value} className="chip">
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(o.value)}
                disabled={checked && selected.length <= minSelected}
              />
              <label htmlFor={inputId}>{o.label}</label>
            </span>
          )
        })}
      </div>
      <div className="chip-filter__shortcuts">
        <button type="button" className="link-btn" onClick={() => onChange(options.map((o) => o.value))}>
          Select all
        </button>
        {minSelected === 0 && (
          <button type="button" className="link-btn" onClick={() => onChange([])}>
            Clear
          </button>
        )}
      </div>
    </fieldset>
  )
}
