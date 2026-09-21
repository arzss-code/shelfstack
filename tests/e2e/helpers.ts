import type { Page } from '@playwright/test'

// Dev server butuh beberapa detik untuk hidrasi Vue (cold start + bundle PrimeVue).
// Tanpa ini, klik terjadi pre-hydration: form submit native (reload) atau @click tak jalan.
// Lihat investigasi Sprint 2: __vue_app__ muncul ~4.4s setelah load di mesin dev.
export async function waitForHydration(page: Page, timeout = 60000) {
  await page.waitForFunction(
    () => !!(document.getElementById('__nuxt') as unknown as Record<string, unknown>).__vue_app__,
    { timeout },
  )
}
