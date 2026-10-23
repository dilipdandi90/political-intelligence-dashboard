import { useId } from 'react'
import { SourceLine } from './SourceList'

/**
 * Frame for every chart: a title, a subtitle that states the unit/denominator,
 * the chart itself and a source line. `description` becomes the accessible
 * name of the chart region for screen-reader users, and `table` (optional)
 * offers the same numbers as an expandable data table.
 */
export function ChartCard({ title, subtitle, description, sources, footnote, table, actions, children }) {
  const titleId = useId()
  return (
    <section className="card chart-card" aria-labelledby={titleId}>
      <header className="card__header">
        <div>
          <h3 id={titleId} className="card__title">
            {title}
          </h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="card__actions">{actions}</div>}
      </header>
      <div className="chart-card__body" role="img" aria-label={description ?? title}>
        {children}
      </div>
      {footnote && <p className="card__footnote">{footnote}</p>}
      {table && (
        <details className="chart-card__table">
          <summary>Show data as table</summary>
          {table}
        </details>
      )}
      <SourceLine sources={sources} />
    </section>
  )
}
