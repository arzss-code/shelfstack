import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileThemeCard from '~/components/account/ProfileThemeCard.vue'

function collectTsVueFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectTsVueFiles(full))
    } else if (/\.(ts|vue)$/.test(entry.name)) {
      results.push(full.replace(/\\/g, '/'))
    }
  }
  return results
}

describe('Stage 3 Remediations: Tokens, Theme Toggle, UX 5-States, & Strict Typing', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('shelfstack-theme')
  })

  it('toggles .dark class on documentElement from Settings ProfileThemeCard and keeps theme toggle out of navbars', async () => {
    const wrapper = mount(ProfileThemeCard)
    const darkBtn = wrapper.get('[data-testid="settings-theme-dark"]')
    const lightBtn = wrapper.get('[data-testid="settings-theme-light"]')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(lightBtn.attributes('aria-pressed')).toBe('true')
    expect(darkBtn.attributes('aria-pressed')).toBe('false')

    await darkBtn.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('shelfstack-theme')).toBe('dark')
    expect(darkBtn.attributes('aria-pressed')).toBe('true')

    await lightBtn.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('shelfstack-theme')).toBe('light')
    expect(lightBtn.attributes('aria-pressed')).toBe('true')

    const navbarSrc = readFileSync(resolve(process.cwd(), 'app/components/AppNavbar.vue'), 'utf8')
    const drawerSrc = readFileSync(
      resolve(process.cwd(), 'app/components/navbar/NavbarMobileDrawer.vue'),
      'utf8',
    )
    const adminLayoutSrc = readFileSync(resolve(process.cwd(), 'app/layouts/admin.vue'), 'utf8')
    expect(navbarSrc).not.toContain('UiThemeToggle')
    expect(drawerSrc).not.toContain('UiThemeToggle')
    expect(adminLayoutSrc).not.toContain('UiThemeToggle')
  })

  it('defaults to light mode even when OS prefers dark scheme and no preference is saved', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    try {
      const wrapper = mount(ProfileThemeCard)
      const lightBtn = wrapper.get('[data-testid="settings-theme-light"]')
      const darkBtn = wrapper.get('[data-testid="settings-theme-dark"]')

      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('shelfstack-theme')).toBeNull()
      expect(lightBtn.attributes('aria-pressed')).toBe('true')
      expect(darkBtn.attributes('aria-pressed')).toBe('false')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('enforces error state with retry CTA and min-w-0 320px guard on /katalog and /c/[slug]', () => {
    const katalogSrc = readFileSync(resolve(process.cwd(), 'app/pages/katalog.vue'), 'utf8')
    const categorySrc = readFileSync(resolve(process.cwd(), 'app/pages/c/[slug].vue'), 'utf8')

    for (const src of [katalogSrc, categorySrc]) {
      expect(src).toContain('min-w-0')
      expect(src).toContain('UiAlert')
      expect(src).toContain('Coba Lagi')
      expect(src).toContain('refresh')
    }
  })

  it('fixes impeccable UI findings on WishlistButton and AdminSupportInboxList without breaking selectors', () => {
    const wishlistSrc = readFileSync(
      resolve(process.cwd(), 'app/components/wishlist/WishlistButton.vue'),
      'utf8',
    )
    expect(wishlistSrc).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
    expect(wishlistSrc).not.toContain('cubic-bezier(0.175, 0.885, 0.32, 1.275)')

    const inboxSrc = readFileSync(
      resolve(process.cwd(), 'app/components/admin/support/AdminSupportInboxList.vue'),
      'utf8',
    )
    expect(inboxSrc).toContain('active-thread is-active')
    expect(inboxSrc).not.toContain('border-l-4')
  })

  it('contains zero explicit any casts outside database.types.ts and zero unguarded client console calls', () => {
    const anyViolations: string[] = []
    for (const root of ['app', 'server', 'shared']) {
      for (const file of collectTsVueFiles(resolve(process.cwd(), root))) {
        if (file.endsWith('app/types/database.types.ts')) continue
        const lines = readFileSync(file, 'utf8').split(/\r?\n/)
        lines.forEach((line, idx) => {
          if (/(\bas\s+any\b|:\s*any\b|<any>)/.test(line)) {
            anyViolations.push(`${file}:${idx + 1}`)
          }
        })
      }
    }
    expect(anyViolations).toEqual([])

    const devGuardToken = ['import', 'meta', 'dev'].join('.')
    const unguardedConsole: string[] = []
    for (const file of collectTsVueFiles(resolve(process.cwd(), 'app'))) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      lines.forEach((line, idx) => {
        if (/\bconsole\.(log|warn|error|info|debug)\b/.test(line)) {
          const contextWindow = lines.slice(Math.max(0, idx - 3), idx + 1).join('\n')
          if (!contextWindow.includes(devGuardToken)) {
            unguardedConsole.push(`${file}:${idx + 1}`)
          }
        }
      })
    }
    expect(unguardedConsole).toEqual([])
  })
})
