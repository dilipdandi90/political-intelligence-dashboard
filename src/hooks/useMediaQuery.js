import { useSyncExternalStore } from 'react'

/**
 * true while the CSS media query matches. Used where layout can't be done in
 * CSS alone, e.g. Recharts axis widths, which are props rather than styles.
 * Falls back to false where matchMedia doesn't exist (tests, SSR).
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  )
}

/** Matches Tailwind's `max-sm` breakpoint (below 640px). */
export const useIsPhone = () => useMediaQuery('(max-width: 639.98px)')
