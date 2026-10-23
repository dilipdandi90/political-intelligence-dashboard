import { cx } from '../../utils/cx'

/**
 * Small styled building blocks. With Tailwind the reusable unit is the
 * component, not a CSS class, so repeated patterns (card, button, callout…)
 * live here instead of being copied as long class strings.
 */

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cx('flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-surface p-4 shadow-sm', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardTitle({ id, children }) {
  return (
    <h3 id={id} className="text-base font-semibold">
      {children}
    </h3>
  )
}

export function CardSubtitle({ children }) {
  return <p className="mt-0.5 text-sm text-muted">{children}</p>
}

export function Footnote({ children }) {
  return <p className="text-xs text-muted">{children}</p>
}

export function Callout({ children, ...props }) {
  return (
    <p className="rounded-lg border border-warn-line bg-warn-soft px-3.5 py-2.5 text-sm" {...props}>
      {children}
    </p>
  )
}

const BUTTON_VARIANTS = {
  default: 'border-line bg-surface text-ink enabled:hover:bg-hover',
  primary: 'border-brand bg-brand text-white enabled:hover:bg-brand-strong',
}

export function Button({ variant = 'default', className, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex min-h-9.5 cursor-pointer items-center justify-center rounded-lg border px-3.5 py-1.5 text-sm font-medium no-underline disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function LinkButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={cx('cursor-pointer border-0 bg-transparent p-0 text-[13px] text-brand underline underline-offset-2', className)}
      {...props}
    />
  )
}

const GRID_LAYOUTS = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 xl:grid-cols-3',
  '2-1': 'xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]',
  '1-1': 'items-start md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]',
}

export function Grid({ cols = 2, children }) {
  return <div className={cx('grid grid-cols-1 gap-4', GRID_LAYOUTS[cols])}>{children}</div>
}
