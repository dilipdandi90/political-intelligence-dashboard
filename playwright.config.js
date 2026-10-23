import { defineConfig } from '@playwright/test'

/**
 * End-to-end tests in a real browser at desktop, tablet and mobile sizes.
 * Runs against the production build (`vite preview`).
 *
 * First run: `npx playwright install chromium`.
 * To use an already-installed browser instead, set PW_CHANNEL=msedge or PW_CHANNEL=chrome.
 */
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
