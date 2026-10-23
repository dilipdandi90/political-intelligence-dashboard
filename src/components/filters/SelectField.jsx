import { useId } from 'react'

/** Labelled native <select>. options: [{ value, label }] */
export function SelectField({ label, value, options, onChange, hint }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="filter">
      <label htmlFor={id} className="filter__label">
        {label}
      </label>
      <select
        id={id}
        className="input select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hintId}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="filter__hint">
          {hint}
        </p>
      )}
    </div>
  )
}
