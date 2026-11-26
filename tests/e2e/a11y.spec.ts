import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { waitForHydration } from './helpers'
import { LoginPage } from './pages/LoginPage'

const PUBLIC_A11Y_ROUTES = [
  { name: 'Beranda', path: '/' },
  { name: 'Katalog Produk', path: '/katalog' },
  { name: 'Keranjang Belanja', path: '/cart' },
  { name: 'Halaman Login', path: '/auth/login' },
]

async function expectNoBlockingA11yViolations(page: Page, contextLabel: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const blockingViolations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  )

  const summary = blockingViolations
    .map(
      (v) =>
        `[${contextLabel}][${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes: ${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(' '))
          .join(', ')})`,
    )
    .join('\n')

  expect(blockingViolations, summary).toEqual([])
}

test.describe('Automated WCAG 2.1 AA Accessibility Audit [SHF-E2E-A11Y]', () => {
  for (const route of PUBLIC_A11Y_ROUTES) {
    test(`${route.name} (${route.path}) bebas pelanggaran aksesibilitas critical/serious`, async ({
      page,
    }) => {
      await page.goto(route.path)
      await waitForHydration(page)
      await expectNoBlockingA11yViolations(page, route.path)
    })
  }

  test('Detail Produk (/product/[id]) bebas pelanggaran aksesibilitas critical/serious', async ({
    page,
  }) => {
    await page.goto('/katalog')
    await waitForHydration(page)

    const firstProduct = page.locator('a[href^="/product/"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 15000 })
    const href = await firstProduct.getAttribute('href')
    expect(href).toMatch(/^\/product\//)

    await page.goto(href || '/katalog')
    await waitForHydration(page)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
    await expectNoBlockingA11yViolations(page, href || '/product/[id]')
  })

  test('Halaman akun terautentikasi (/orders & /account/vouchers) bebas pelanggaran critical/serious', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await waitForHydration(page)
    await loginPage.loginAsCustomer()

    for (const path of ['/orders', '/account/vouchers']) {
      await page.goto(path)
      await waitForHydration(page)
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
      await expectNoBlockingA11yViolations(page, path)
    }
  })

  test('Halaman back-office admin (Light & Dark + zero overflow) bebas pelanggaran critical/serious', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await waitForHydration(page)
    await loginPage.loginAsAdmin()

    const adminRoutes = [
      '/admin',
      '/admin/orders',
      '/admin/products',
      '/admin/reviews',
      '/admin/support',
      '/admin/users',
      '/admin/activities',
    ]

    for (const path of adminRoutes) {
      await page.goto(path)
      await waitForHydration(page)
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15000 })
      await page.waitForTimeout(450)

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
      expect(hasHorizontalOverflow, `${path} tidak boleh mengalami horizontal overflow`).toBe(false)

      await expectNoBlockingA11yViolations(page, `${path} [light]`)

      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.waitForTimeout(450)
      await expectNoBlockingA11yViolations(page, `${path} [dark]`)
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
    }
  })
})
