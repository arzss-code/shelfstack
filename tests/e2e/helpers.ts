import type { Page } from '@playwright/test'

// Dev server butuh beberapa detik untuk hidrasi Vue (cold start + bundle PrimeVue).
// Tanpa ini, klik terjadi pre-hydration: form submit native (reload) atau @click tak jalan.
// Lihat investigasi Sprint 2: __vue_app__ muncul ~4.4s setelah load di mesin dev.
// Revisi: kehadiran __vue_app__ saja tidak cukup, root component harus sudah
// mounted (listener terpasang). Tanpa ini, klik tombol submit jatuh ke native
// form submit (reload ke /auth/login?) meski __vue_app__ sudah ada.
export async function waitForHydration(page: Page, timeout = 60000) {
  await page.waitForFunction(
    () => {
      const el = document.getElementById('__nuxt') as unknown as {
        __vue_app__?: { _instance?: { isMounted?: boolean } | null }
      }
      const app = el.__vue_app__
      if (!app) return false
      if (!app._instance) return true
      return app._instance.isMounted === true
    },
    { timeout },
  )
}
