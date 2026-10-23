import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/lok-sabha', label: 'Lok Sabha history' },
  { to: '/assembly', label: 'Assembly segments' },
  { to: '/trends', label: 'Trends & indicators' },
  { to: '/data', label: 'Data & methodology' },
]

export function AppShell() {
  const mainRef = useRef(null)
  const { pathname } = useLocation()

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

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="7" fill="currentColor" />
              <rect x="7" y="17" width="4" height="8" rx="1" fill="#fff" />
              <rect x="14" y="11" width="4" height="14" rx="1" fill="#fff" />
              <rect x="21" y="7" width="4" height="18" rx="1" fill="#f4a261" />
            </svg>
          </span>
          <div>
            <p className="topbar__title">Political Intelligence Dashboard</p>
            <p className="topbar__subtitle">Pune Lok Sabha constituency · Maharashtra</p>
          </div>
        </div>
      </header>

      <nav className="sidenav" aria-label="Dashboard sections">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => `sidenav__link${isActive ? ' is-active' : ''}`}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p>
          Election figures are compiled from public sources that reproduce Election Commission of India results;
          demographic figures are from Census of India 2011. Not an official ECI product — see{' '}
          <NavLink to="/data">Data &amp; methodology</NavLink> for sources and limitations.
        </p>
      </footer>
    </div>
  )
}
