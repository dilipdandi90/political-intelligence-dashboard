import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../../utils/cx'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/lok-sabha', label: 'Lok Sabha history' },
  { to: '/assembly', label: 'Assembly segments' },
  { to: '/trends', label: 'Trends & indicators' },
  { to: '/data', label: 'Data & methodology' },
]

const NAV_ID = 'site-nav'

export function AppShell() {
  const mainRef = useRef(null)
  const menuButtonRef = useRef(null)
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Move focus to the main region on route change so keyboard and screen-reader
  // users land on the new content instead of staying in the nav.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [pathname])

  // Escape closes the mobile menu and puts focus back on the button that opened it.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <a
        href="#main"
        className="absolute -top-12 left-3 z-50 rounded-md bg-brand px-3.5 py-2 text-white no-underline focus:top-3"
      >
        Skip to content
      </a>

      <div className="sticky top-0 z-30 lg:contents">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:col-span-2">
          <span className="flex shrink-0 text-brand" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="7" fill="currentColor" />
              <rect x="7" y="17" width="4" height="8" rx="1" fill="#fff" />
              <rect x="14" y="11" width="4" height="14" rx="1" fill="#fff" />
              <rect x="21" y="7" width="4" height="18" rx="1" fill="#f4a261" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">Political Intelligence Dashboard</p>
            <p className="truncate text-[13px] text-muted">Pune Lok Sabha constituency · Maharashtra</p>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="ml-auto inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-hover lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </header>

        <nav
          id={NAV_ID}
          aria-label="Dashboard sections"
          className={cx(
            'absolute inset-x-0 top-full border-b border-line bg-surface shadow-lg',
            menuOpen ? 'block' : 'hidden',
            'lg:static lg:col-start-1 lg:row-start-2 lg:block lg:border-r lg:border-b-0 lg:shadow-none',
          )}
        >
          <ul className="flex list-none flex-col gap-1 px-3 py-3 lg:sticky lg:top-0 lg:py-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'block rounded-lg px-3 py-2.5 text-[0.95rem] no-underline lg:py-2 lg:text-[0.92rem]',
                      isActive ? 'bg-brand-soft font-semibold text-brand-strong' : 'font-medium text-muted hover:bg-hover hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {menuOpen && <div className="fixed inset-0 z-20 bg-ink/30 lg:hidden" aria-hidden="true" onClick={() => setMenuOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col lg:col-start-2 lg:row-start-2">
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-350 min-w-0 flex-1 px-4 pt-5 pb-10 outline-none lg:px-8 lg:pt-7 lg:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
