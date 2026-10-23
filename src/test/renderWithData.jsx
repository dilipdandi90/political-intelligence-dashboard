import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

const DATA_DIR = resolve(__dirname, '../../public/data')

/** The real JSON files shipped with the app, keyed by file name. */
export function realData() {
  return Object.fromEntries(
    ['constituency.json', 'lok-sabha.json', 'assembly.json'].map((f) => [f, JSON.parse(readFileSync(resolve(DATA_DIR, f), 'utf8'))]),
  )
}

/**
 * Replaces global fetch with one that serves the given payloads by file name.
 * A payload of `{ status: 500 }` (wrapped with httpError) simulates a server error;
 * a string is returned as-is to simulate invalid JSON.
 */
export function stubFetch(files) {
  const fetchMock = vi.fn(async (url) => {
    const name = String(url).split('/').pop()
    const body = files[name]
    if (body === undefined || body?.__httpError) {
      return { ok: false, status: body?.status ?? 404, json: async () => ({}) }
    }
    return {
      ok: true,
      status: 200,
      json: async () => (typeof body === 'string' ? JSON.parse(body) : structuredClone(body)),
    }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const httpError = (status) => ({ __httpError: true, status })

/** Renders a page component at a URL inside a router. */
export function renderAt(element, url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>,
  )
}
