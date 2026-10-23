/**
 * Tiny fetch wrapper used by the mock API.
 *
 * The "API" is a set of static JSON files under /public/data, so the app can be
 * deployed anywhere without a backend. Two dev conveniences make the async
 * states visible:
 *   - VITE_MOCK_LATENCY_MS (env) adds an artificial delay to every request.
 *   - `?mockError=<file>` or `?mockError=all` in the page URL forces a failure,
 *     so error states can be demoed without breaking anything.
 */

const DATA_ROOT = `${import.meta.env.BASE_URL}data/`
const LATENCY_MS = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 0)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

function shouldSimulateError(file) {
  if (typeof window === 'undefined') return false
  const flag = new URLSearchParams(window.location.search).get('mockError')
  return flag === 'all' || flag === file.replace(/\.json$/, '')
}

/**
 * @param {string} file  file name under /data, e.g. "lok-sabha.json"
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getJson(file, { signal } = {}) {
  if (LATENCY_MS > 0) await sleep(LATENCY_MS, signal)

  if (shouldSimulateError(file)) {
    throw new ApiError(`Simulated failure while loading ${file}`, 503)
  }

  let response
  try {
    response = await fetch(`${DATA_ROOT}${file}`, { signal, headers: { Accept: 'application/json' } })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(`Network error while loading ${file}. Check your connection and try again.`)
  }

  if (!response.ok) {
    throw new ApiError(`Could not load ${file} (HTTP ${response.status}).`, response.status)
  }

  try {
    return await response.json()
  } catch {
    throw new ApiError(`${file} is not valid JSON.`)
  }
}
