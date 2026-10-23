/**
 * The three non-happy states every data-driven section can be in.
 * Loading uses role="status" so screen readers announce it politely; errors use
 * role="alert" so they are announced immediately.
 */

export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className="status status--loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div className="status status--error" role="alert">
      <p className="status__title">{title}</p>
      {error?.message && <p className="status__detail">{error.message}</p>}
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'No data available', children }) {
  return (
    <div className="status status--empty">
      <p className="status__title">{title}</p>
      {children && <div className="status__detail">{children}</div>}
    </div>
  )
}

/**
 * Renders loading / error states for a `useAsync` result and calls
 * `children(data)` once the data has arrived.
 */
export function AsyncContent({ query, loadingLabel, errorTitle = 'Could not load data', children }) {
  if (query.status === 'loading') return <LoadingState label={loadingLabel} />
  if (query.status === 'error') return <ErrorState title={errorTitle} error={query.error} onRetry={query.retry} />
  return children(query.data)
}
