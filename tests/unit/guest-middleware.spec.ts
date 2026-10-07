import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import guestMiddleware from '~/middleware/guest'

const { mockUser, mockNavigateTo } = vi.hoisted(() => ({
  mockUser: { value: null as { id: string } | null },
  mockNavigateTo: vi.fn((path: string) => path),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('Guest Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.value = null
  })

  it('allows access when user is not authenticated', () => {
    const to = { query: {} } as any
    const from = { query: {} } as any

    const result = (guestMiddleware as any)(to, from)

    expect(result).toBeUndefined()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects to "/" when user is logged in without redirect query', () => {
    mockUser.value = { id: 'test-user-id' }
    const to = { query: {} } as any
    const from = { query: {} } as any

    const result = (guestMiddleware as any)(to, from)

    expect(mockNavigateTo).toHaveBeenCalledWith('/')
    expect(result).toBe('/')
  })

  it('redirects to safe target path when redirect query is provided', () => {
    mockUser.value = { id: 'test-user-id' }
    const to = { query: { redirect: '/checkout' } } as any
    const from = { query: {} } as any

    const result = (guestMiddleware as any)(to, from)

    expect(mockNavigateTo).toHaveBeenCalledWith('/checkout')
    expect(result).toBe('/checkout')
  })

  it('sanitizes open-redirect attempts and falls back to "/"', () => {
    mockUser.value = { id: 'test-user-id' }
    const to = { query: { redirect: '//malicious-site.com' } } as any
    const from = { query: {} } as any

    const result = (guestMiddleware as any)(to, from)

    expect(mockNavigateTo).toHaveBeenCalledWith('/')
    expect(result).toBe('/')
  })
})
