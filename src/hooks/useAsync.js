import { useCallback, useEffect, useState } from 'react'

/**
 * Runs an async loader on mount and exposes { status, data, error, retry }.
 * status: 'loading' | 'success' | 'error'
 *
 * The loader must be stable (a module-level function or wrapped in useCallback),
 * otherwise it will re-run on every render.
 */
export function useAsync(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    loader()
      .then((data) => active && setState({ status: 'success', data, error: null }))
      .catch((error) => active && setState({ status: 'error', data: null, error }))
    return () => {
      active = false
    }
  }, [loader, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', data: null, error: null })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}
