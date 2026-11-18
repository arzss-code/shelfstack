import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiThemeToggle from '~/components/ui/UiThemeToggle.vue'

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

  it('toggles .dark class on documentElement and persists preference via UiThemeToggle', async () => {
    const wrapper = mount(UiThemeToggle)
    const btn = wrapper.get('[data-testid="theme-toggle-button"]')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(btn.attributes('aria-label')).toContain('gelap')

    await btn.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('shelfstack-theme')).toBe('dark')
    expect(btn.attributes('aria-label')).toContain('terang')

    await btn.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('shelfstack-theme')).toBe('light')
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
