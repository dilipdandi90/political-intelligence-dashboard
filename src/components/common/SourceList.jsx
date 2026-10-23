/** Compact "Source: A; B" line used under charts and tables. */
export function SourceLine({ sources, prefix = 'Source' }) {
  if (!sources?.length) return null
  return (
    <p className="source-line">
      <span className="source-line__prefix">{prefix}:</span>{' '}
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
    <details className="notes">
      <summary>
        {title} ({notes.length})
      </summary>
      <ul>
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </details>
  )
}
