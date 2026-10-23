import { expect, test } from '@playwright/test'

/**
 * Runs once per viewport project (desktop 1440px, tablet 768px, mobile 390px).
 */

const ROUTES = [
  { path: '/', heading: 'Pune Lok Sabha Constituency' },
  { path: '/lok-sabha', heading: 'Lok Sabha election history' },
  { path: '/assembly', heading: 'Assembly segment explorer' },
  { path: '/trends', heading: 'Electoral trends & indicators' },
  { path: '/data', heading: 'Data & methodology' },
]

/** Fails if the page itself scrolls sideways (wide tables must scroll inside their own container). */
async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(0)
}

test.describe('every page', () => {
  for (const { path, heading } of ROUTES) {
    test(`${path} renders without errors or horizontal overflow`, async ({ page }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(page.getByRole('status')).toHaveCount(0, { timeout: 10_000 }) // all loading states resolved
      await expectNoHorizontalOverflow(page)
      expect(errors).toEqual([])
    })
  }
})

test('navigation works from the menu', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Dashboard sections' })
  await nav.getByRole('link', { name: 'Assembly segments' }).click()
  await expect(page).toHaveURL(/\/assembly$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Assembly segment explorer' })).toBeVisible()
  await nav.getByRole('link', { name: 'Overview' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pune Lok Sabha Constituency' })).toBeVisible()
})

test('charts render as SVG and fit inside the viewport', async ({ page }) => {
  await page.goto('/lok-sabha')
  const charts = page.locator('.chart-card__body svg.recharts-surface')
  await expect(charts.first()).toBeVisible()
  expect(await charts.count()).toBeGreaterThanOrEqual(3)

  const viewportWidth = page.viewportSize().width
  for (const box of await charts.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
    expect(box).toBeLessThanOrEqual(viewportWidth)
  }
})

test('Lok Sabha filters update table, KPIs and URL', async ({ page }) => {
  await page.goto('/lok-sabha')
  const summary = page.getByRole('region', { name: 'Lok Sabha results by year' })
  await expect(summary.getByRole('row')).toHaveCount(5)

  // click + auto-waiting assertion rather than uncheck(): the URL update is applied as a
  // React transition, so the checkbox settles a frame after the click
  const year2009 = page.getByRole('checkbox', { name: '2009' })
  await year2009.click()
  await expect(year2009).not.toBeChecked()
  await expect(summary.getByRole('row')).toHaveCount(4)
  await expect(page).toHaveURL(/years=2014%2C2019%2C2024|years=2014,2019,2024/)

  await page.getByLabel('Inspect year in detail').selectOption('2014')
  await expect(page.getByRole('heading', { name: '2014 general election in detail' })).toBeVisible()
  await expect(page.locator('.kpi', { hasText: 'Winner' }).first()).toContainText('Anil Shirole')
})

test('Assembly segment dropdown updates the segment view', async ({ page }) => {
  await page.goto('/assembly')
  await page.getByLabel('Assembly constituency').selectOption('214')
  await expect(page.getByRole('heading', { name: '214 – Pune Cantonment' })).toBeVisible()
  await expect(page.getByText('Reserved for Scheduled Castes')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('wide tables scroll inside their container, not the page', async ({ page }) => {
  await page.goto('/assembly')
  const scroller = page.getByRole('region', { name: /Assembly segment outcomes/ })
  await expect(scroller).toBeVisible()
  const { scrollWidth, clientWidth } = await scroller.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }))
  if (page.viewportSize().width < 768) expect(scrollWidth).toBeGreaterThan(clientWidth) // table is scrollable on phones
  await expectNoHorizontalOverflow(page)
})

test('error state is shown and the rest of the app stays usable', async ({ page }) => {
  await page.goto('/lok-sabha?mockError=lok-sabha')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Could not load Lok Sabha results')
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
