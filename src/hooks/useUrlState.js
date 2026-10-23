import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filter state lives in the query string (e.g. ?years=2014,2024&ac=210) so a
 * filtered view can be bookmarked or shared, and the back button works.
 */

/**
 * A list of values stored as a comma-separated query param.
 * Returns `fallback` when the param is absent; unknown values are dropped.
 *
 * @param {string} key
 * @param {string[]} allowed
 * @param {string[]} fallback
 */
export function useUrlList(key, allowed, fallback) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)

  const value = useMemo(() => {
    if (raw == null) return fallback
    if (raw === '') return []
    return raw.split(',').filter((v) => allowed.includes(v))
  }, [raw, allowed, fallback])

  const setValue = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set(key, next.join(','))
          return p
        },
        { replace: true },
      )
    },
    [key, setParams],
  )

  return [value, setValue]
}

/**
 * A single value stored as a query param.
 * @param {string} key
 * @param {string[]} allowed
 * @param {string} fallback
 */
export function useUrlValue(key, allowed, fallback) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)
  const value = raw != null && allowed.includes(raw) ? raw : fallback

  const setValue = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set(key, next)
          return p
        },
        { replace: true },
      )
    },
    [key, setParams],
  )

  return [value, setValue]
}
