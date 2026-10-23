import { useEffect } from 'react'

export function PageHeader({ title, eyebrow, children }) {
  useEffect(() => {
    document.title = `${title} · Pune PC Dashboard`
  }, [title])

  return (
    <header className="mb-5">
      {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wider text-brand uppercase">{eyebrow}</p>}
      <h1 className="text-[clamp(1.4rem,2.5vw,1.9rem)] leading-tight font-bold tracking-tight">{title}</h1>
      {children && <div className="mt-2 max-w-[75ch] text-muted">{children}</div>}
    </header>
  )
}

export function Section({ title, description, children, id }) {
  return (
    <section className="mt-8 flex flex-col gap-4" aria-labelledby={id}>
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-[85ch] text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** A vertical stack of blocks inside a section. */
export function Stack({ children }) {
  return <div className="mt-2 flex flex-col gap-4">{children}</div>
}
