import { useId } from 'react'
import { CONTROL, FIELD, FIELD_LABEL } from './fieldStyles'

/** Labelled native <select>. options: [{ value, label }] */
export function SelectField({ label, value, options, onChange, hint }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className={FIELD}>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <select id={id} className={CONTROL} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hintId}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="max-w-[48ch] text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
