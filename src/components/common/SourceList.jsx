/** Compact "Source: A; B" line used under charts and tables. */
export function SourceLine({ sources, prefix = 'Source' }) {
  if (!sources?.length) return null
  return (
    <p className="mt-auto border-t border-dashed border-line pt-2 text-xs text-muted">
      <span className="font-semibold">{prefix}:</span>{' '}
      {sources.map((s, i) => (
        <span key={`${s.label}-${i}`}>
          {i > 0 && '; '}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              {s.label}
            </a>
          ) : (
            s.label
          )}
        </span>
      ))}
    </p>
  )
}

/** Data caveats attached to a record or dataset. */
export function Notes({ notes, title = 'Data notes' }) {
  if (!notes?.length) return null
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium text-brand">
        {title} ({notes.length})
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-muted">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </details>
  )
}
