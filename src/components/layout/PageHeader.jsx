import { useEffect } from 'react'

export function PageHeader({ title, eyebrow, children }) {
  useEffect(() => {
    document.title = `${title} · Pune PC Dashboard`
  }, [title])

  return (
    <header className="page-header">
      {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
      <h1 className="page-header__title">{title}</h1>
      {children && <div className="page-header__lead">{children}</div>}
    </header>
  )
}

export function Section({ title, description, children, id }) {
  return (
    <section className="section" aria-labelledby={id}>
      <div className="section__head">
        <h2 id={id} className="section__title">
          {title}
        </h2>
        {description && <p className="section__desc">{description}</p>}
      </div>
      {children}
    </section>
  )
}
