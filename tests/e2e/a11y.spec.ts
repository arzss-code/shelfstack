import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { waitForHydration } from './helpers'

const PUBLIC_A11Y_ROUTES = [
  { name: 'Beranda', path: '/' },
  { name: 'Katalog Produk', path: '/katalog' },
  { name: 'Keranjang Belanja', path: '/cart' },
  { name: 'Halaman Login', path: '/auth/login' },
]

test.describe('Automated WCAG 2.1 AA Accessibility Audit [SHF-E2E-A11Y]', () => {
  for (const route of PUBLIC_A11Y_ROUTES) {
    test(`${route.name} (${route.path}) bebas pelanggaran aksesibilitas critical/serious`, async ({
      page,
    }) => {
      await page.goto(route.path)
      await waitForHydration(page)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const blockingViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )

      const summary = blockingViolations
        .map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes: ${v.nodes
              .slice(0, 2)
              .map((n) => n.target.join(' '))
              .join(', ')})`,
        )
        .join('\n')

      expect(blockingViolations, summary).toEqual([])
    })
  }
})
