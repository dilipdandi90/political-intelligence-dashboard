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

/** Below 1024px the section links sit behind the header's menu button. */
const isCollapsedNav = (page) => page.viewportSize().width < 1024

async function openMenuIfCollapsed(page) {
  if (isCollapsedNav(page)) await page.getByRole('button', { name: 'Open menu' }).click()
}

test('navigation works from the menu', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Dashboard sections' })

  await openMenuIfCollapsed(page)
  await nav.getByRole('link', { name: 'Assembly segments' }).click()
  await expect(page).toHaveURL(/\/assembly$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Assembly segment explorer' })).toBeVisible()

  await openMenuIfCollapsed(page)
  await nav.getByRole('link', { name: 'Overview' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pune Lok Sabha Constituency' })).toBeVisible()
})

test('menu button: vertical menu on phones/tablets, sidebar on desktop', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Dashboard sections' })
  const menuButton = page.getByRole('button', { name: /menu/i })

  if (!isCollapsedNav(page)) {
    await expect(menuButton).toBeHidden()
    await expect(nav.getByRole('link', { name: 'Trends & indicators' })).toBeVisible()
    return
  }

  // collapsed by default, button sits at the top right
  await expect(nav).toBeHidden()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  const btn = await menuButton.boundingBox()
  expect(btn.x + btn.width).toBeGreaterThan(page.viewportSize().width - 40)

  // opens as a vertical list
  await menuButton.click()
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  const links = nav.getByRole('link')
  await expect(links).toHaveCount(5)
  const first = await links.nth(0).boundingBox()
  const second = await links.nth(1).boundingBox()
  expect(second.y).toBeGreaterThan(first.y) // stacked, not side by side
  expect(Math.abs(second.x - first.x)).toBeLessThan(2)

  // Escape closes it and returns focus to the button
  await page.keyboard.press('Escape')
  await expect(nav).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()

  // the menu stays reachable after scrolling, because the header is sticky
  await page.mouse.wheel(0, 2000)
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeInViewport()

  // picking a section navigates and closes the menu
  await page.getByRole('button', { name: 'Open menu' }).click()
  await nav.getByRole('link', { name: 'Lok Sabha history' }).click()
  await expect(page).toHaveURL(/\/lok-sabha$/)
  await expect(nav).toBeHidden()
})

test('charts render as SVG and fit inside the viewport', async ({ page }) => {
  await page.goto('/lok-sabha')
  const charts = page.locator('[data-chart-body] svg.recharts-surface')
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
  await expect(summary.locator('tbody tr')).toHaveCount(4) // one per election (the header row is hidden on phones)

  // click + auto-waiting assertion rather than uncheck(): the URL update is applied as a
  // React transition, so the checkbox settles a frame after the click
  const year2009 = page.getByRole('checkbox', { name: '2009' })
  await year2009.click()
  await expect(year2009).not.toBeChecked()
  await expect(summary.locator('tbody tr')).toHaveCount(3)
  await expect(page).toHaveURL(/years=2014%2C2019%2C2024|years=2014,2019,2024/)

  await page.getByLabel('Inspect year in detail').selectOption('2014')
  await expect(page.getByRole('heading', { name: '2014 general election in detail' })).toBeVisible()
  await expect(page.locator('[data-kpi]', { hasText: 'Winner' }).first()).toContainText('Anil Shirole')
})

test('Assembly segment dropdown updates the segment view', async ({ page }) => {
  await page.goto('/assembly')
  await page.getByLabel('Assembly constituency').selectOption('214')
  await expect(page.getByRole('heading', { name: '214 – Pune Cantonment' })).toBeVisible()
  await expect(page.getByText('Reserved for Scheduled Castes')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('tables become stacked cards on phones and scroll in their own box on wider screens', async ({ page }) => {
  await page.goto('/assembly')
  const region = page.getByRole('region', { name: /Assembly segment outcomes/ })
  await expect(region).toBeVisible()
  const layout = await region.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    rowDisplay: getComputedStyle(el.querySelector('tbody tr')).display,
    headerVisible: getComputedStyle(el.querySelector('thead')).display !== 'none',
  }))

  if (page.viewportSize().width < 640) {
    expect(layout.rowDisplay).toBe('block') // each row is a card
    expect(layout.headerVisible).toBe(false)
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth) // nothing to scroll sideways
    await expect(page.getByLabel('Sort by').first()).toBeVisible() // sorting still available
  } else {
    expect(layout.rowDisplay).toBe('table-row')
    expect(layout.headerVisible).toBe(true)
  }
  await expectNoHorizontalOverflow(page)
})

test('phone layout: every table fits the screen without sideways scrolling', async ({ page }) => {
  test.skip(page.viewportSize().width >= 640, 'phone-only check')
  for (const path of ['/', '/lok-sabha', '/assembly', '/trends']) {
    await page.goto(path)
    await expect(page.getByRole('status')).toHaveCount(0, { timeout: 10_000 })
    const overflowing = await page.$$eval('[role="region"][aria-label]', (els) =>
      els
        .filter((el) => el.querySelector('tbody tr') && getComputedStyle(el.querySelector('tbody tr')).display === 'block')
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.getAttribute('aria-label')),
    )
    expect(overflowing, `card tables overflowing on ${path}`).toEqual([])
  }
})

test('error state is shown and the rest of the app stays usable', async ({ page }) => {
  await page.goto('/lok-sabha?mockError=lok-sabha')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Could not load Lok Sabha results')
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
