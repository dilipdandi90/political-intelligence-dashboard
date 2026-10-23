import { useId } from 'react'
import { Card, CardSubtitle, CardTitle, Footnote } from '../ui'
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
    <Card as="section" aria-labelledby={titleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle id={titleId}>{title}</CardTitle>
          {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
        </div>
        {actions && <div>{actions}</div>}
      </header>
      <div data-chart-body className="min-h-45 w-full" role="img" aria-label={description ?? title}>
        {children}
      </div>
      {footnote && <Footnote>{footnote}</Footnote>}
      {table && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-brand group-open:mb-2">Show data as table</summary>
          {table}
        </details>
      )}
      <SourceLine sources={sources} />
    </Card>
  )
}
