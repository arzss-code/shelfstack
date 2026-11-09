import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import CallbackPage from '../../app/pages/auth/callback.vue'

const { mockRoute, mockSeoMeta, mockUserData, mockNavigateTo, mockFetchProfile, mockIsAdmin } =
  vi.hoisted(() => {
    return {
      mockRoute: {
        query: {} as Record<string, string>,
        path: '/auth/callback',
      },
      mockSeoMeta: vi.fn(),
      mockUserData: { value: null as { id: string; email: string } | null },
      mockNavigateTo: vi.fn(),
      mockFetchProfile: vi.fn(),
      mockIsAdmin: { value: false },
    }
  })

const mockUserRef = ref(mockUserData.value)

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useSeoMeta', () => mockSeoMeta)
mockNuxtImport('useSupabaseUser', () => () => mockUserRef)
mockNuxtImport('navigateTo', () => mockNavigateTo)

vi.mock('~/features/auth/composables/useAuth', () => ({
  useAuth: () => ({
    fetchProfile: mockFetchProfile,
    isAdmin: mockIsAdmin,
  }),
}))

describe('Auth Callback Page: OAuth Flow & 5 Mandatory UI States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUserRef.value = null
    mockRoute.query = {}
    mockIsAdmin.value = false
    mockFetchProfile.mockResolvedValue({ id: 'p1', role: 'customer' })
  })

  it('menampilkan status loading secara default saat sesi sedang diverifikasi', () => {
    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: true,
          UiButton: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Menghubungkan Akun Google')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('menampilkan status error jika pengguna membatalkan otorisasi Google (access_denied)', async () => {
    mockRoute.query = {
      error: 'access_denied',
      error_description: 'The user denied the request',
    }

    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: {
            template: '<div class="ui-alert-mock"><slot /></div>',
          },
          UiButton: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Permintaan akses Google dibatalkan')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('menampilkan status error jika terjadi timeout verifikasi sesi', async () => {
    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: {
            props: ['title'],
            template: '<div class="ui-alert-mock"><h3>{{ title }}</h3><slot /></div>',
          },
          UiButton: true,
        },
      },
    })

    vi.advanceTimersByTime(10001)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Waktu Verifikasi Sesi Habis')
  })

  it('berhasil memproses sesi dan mengarahkan pelanggan biasa ke beranda (/)', async () => {
    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: true,
          UiButton: true,
        },
      },
    })

    mockUserRef.value = { id: 'usr-123', email: 'customer@example.com' }
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetchProfile).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalledWith('/', { replace: true })
  })

  it('mengarahkan admin ke /admin/activities jika role terbukti admin', async () => {
    mockIsAdmin.value = true
    mockFetchProfile.mockResolvedValue({ id: 'p-admin', role: 'admin' })

    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: true,
          UiButton: true,
        },
      },
    })

    mockUserRef.value = { id: 'admin-123', email: 'admin@shelfstack.local' }
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()

    expect(mockNavigateTo).toHaveBeenCalledWith('/admin/activities', { replace: true })
  })

  it('menghormati parameter query redirect yang sah', async () => {
    mockRoute.query = { redirect: '/cart' }
    mockIsAdmin.value = false

    const wrapper = mount(CallbackPage, {
      global: {
        stubs: {
          UiAlert: true,
          UiButton: true,
        },
      },
    })

    mockUserRef.value = { id: 'usr-456', email: 'user@example.com' }
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()

    expect(mockNavigateTo).toHaveBeenCalledWith('/cart', { replace: true })
  })

  it('memastikan berkas callback.vue mematuhi batas 300 baris kode dan bebas em dash', () => {
    const filePath = path.join(process.cwd(), 'app', 'pages', 'auth', 'callback.vue')
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    expect(lines.length).toBeLessThanOrEqual(300)
    expect(content.includes('\u2014')).toBe(false)
  })
})
