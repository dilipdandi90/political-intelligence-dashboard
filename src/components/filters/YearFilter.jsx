import { useId } from 'react'
import { LinkButton } from '../ui'
import { FIELD, FIELD_LABEL } from './fieldStyles'

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
    <fieldset className={FIELD}>
      <legend className={`${FIELD_LABEL} mb-1.5`}>{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const checked = selected.includes(o.value)
          const inputId = `${id}-${o.value}`
          return (
            <span key={o.value} className="relative">
              {/* invisible checkbox laid over the chip: clicks and keyboard focus land on the real input */}
              <input
                id={inputId}
                type="checkbox"
                className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                checked={checked}
                onChange={() => toggle(o.value)}
                disabled={checked && selected.length <= minSelected}
              />
              <label
                htmlFor={inputId}
                className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm font-medium select-none peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-checked:before:mr-1.5 peer-checked:before:text-[0.8em] peer-checked:before:content-['✓'] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
              >
                {o.label}
              </label>
            </span>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-3">
        <LinkButton onClick={() => onChange(options.map((o) => o.value))}>Select all</LinkButton>
        {minSelected === 0 && <LinkButton onClick={() => onChange([])}>Clear</LinkButton>}
      </div>
    </fieldset>
  )
}
