import { getJson } from './client'
import { normaliseAssembly, normaliseConstituency, normaliseLokSabha } from './schema'

/**
 * Public data-access functions. UI code only ever calls these – it never knows
 * file names or raw JSON shapes, so swapping the static files for a real API
 * means changing this module and nothing else.
 *
 * Successful responses are cached for the session so navigating between pages
 * doesn't refetch. Failed requests are dropped from the cache, so "Retry"
 * really retries.
 *
 * Note: the shared request deliberately takes no AbortSignal. Several
 * components can be waiting on the same promise, and one of them unmounting
 * must not cancel it for the others – callers just ignore late results.
 */

const cache = new Map()

function cached(key, loader) {
  return () => {
    if (!cache.has(key)) {
      cache.set(
        key,
        loader().catch((err) => {
          cache.delete(key)
          throw err
        }),
      )
    }
    return cache.get(key)
  }
}

export const fetchConstituencyProfile = cached('constituency', async () =>
  normaliseConstituency(await getJson('constituency.json')),
)

export const fetchLokSabhaResults = cached('lok-sabha', async () => normaliseLokSabha(await getJson('lok-sabha.json')))

export const fetchAssemblyResults = cached('assembly', async () => normaliseAssembly(await getJson('assembly.json')))

/** Used by tests to start from a clean slate. */
export function clearApiCache() {
  cache.clear()
}
