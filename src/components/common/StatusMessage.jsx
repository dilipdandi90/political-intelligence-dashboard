import { Button } from '../ui'

/**
 * The three non-happy states every data-driven section can be in.
 * Loading uses role="status" so screen readers announce it politely; errors use
 * role="alert" so they are announced immediately.
 */

const BOX = 'my-3 flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-7 text-center'

export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className={`${BOX} flex-row border border-dashed border-line bg-surface text-muted`} role="status" aria-live="polite">
      <span className="size-4.5 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:[animation-duration:2.4s]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div className={`${BOX} border border-danger bg-danger-soft`} role="alert">
      <p className="font-semibold">{title}</p>
      {error?.message && <p className="text-sm">{error.message}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'No data available', children }) {
  return (
    <div className={`${BOX} border border-dashed border-line bg-surface text-muted`}>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="text-sm">{children}</div>}
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
