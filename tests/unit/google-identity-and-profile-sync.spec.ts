import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useGoogleIdentity } from '../../app/composables/useGoogleIdentity'

const { mockRuntimeConfig, mockSupabaseClient, mockNuxtState } = vi.hoisted(() => {
  return {
    mockRuntimeConfig: {
      public: {
        googleClientId: 'test-google-client-id.apps.googleusercontent.com',
      },
    },
    mockSupabaseClient: {
      auth: {
        signInWithIdToken: vi.fn(),
        signInWithOAuth: vi.fn(),
      },
      from: vi.fn(),
    },
    mockNuxtState: {} as Record<string, unknown>,
  }
})

mockNuxtImport('useRuntimeConfig', () => () => mockRuntimeConfig)
mockNuxtImport('useSupabaseClient', () => () => mockSupabaseClient)
mockNuxtImport('useState', () => (key: string, init?: () => unknown) => {
  if (!(key in mockNuxtState)) {
    mockNuxtState[key] = { value: init ? init() : null }
  }
  return mockNuxtState[key]
})

describe('Google Identity Services & Profile Metadata Sync Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuntimeConfig.public.googleClientId = 'test-google-client-id.apps.googleusercontent.com'
  })

  it('mendeteksi konfigurasi Google Client ID secara tepat pada composable', () => {
    const { googleClientId, isConfigured } = useGoogleIdentity()
    expect(googleClientId.value).toBe('test-google-client-id.apps.googleusercontent.com')
    expect(isConfigured.value).toBe(true)

    mockRuntimeConfig.public.googleClientId = ''
    const { isConfigured: isConfiguredEmpty } = useGoogleIdentity()
    expect(isConfiguredEmpty.value).toBe(false)
  })

  it('berhasil menginisialisasi GIS jika SDK Google sudah tersedia di window', async () => {
    const mockInitialize = vi.fn()
    window.google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          prompt: vi.fn(),
          renderButton: vi.fn(),
          disableAutoSelect: vi.fn(),
        },
      },
    }

    const { initGoogleIdentity, isGisLoaded } = useGoogleIdentity()
    const onSuccess = vi.fn()

    const initialized = await initGoogleIdentity({ onSuccess })
    expect(initialized).toBe(true)
    expect(isGisLoaded.value).toBe(true)
    expect(mockInitialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-google-client-id.apps.googleusercontent.com',
        auto_select: false,
      }),
    )
  })

  it('meneruskan callback credential Google ke handler onSuccess', async () => {
    let capturedCallback: ((res: { credential?: string }) => Promise<void>) | null = null

    window.google = {
      accounts: {
        id: {
          initialize: vi.fn((config) => {
            capturedCallback = config.callback
          }),
          prompt: vi.fn(),
          renderButton: vi.fn(),
          disableAutoSelect: vi.fn(),
        },
      },
    }

    const { initGoogleIdentity } = useGoogleIdentity()
    const onSuccess = vi.fn()

    await initGoogleIdentity({ onSuccess })
    expect(capturedCallback).not.toBeNull()

    if (capturedCallback) {
      await (capturedCallback as (res: { credential?: string }) => Promise<void>)({
        credential: 'mock-jwt-id-token-12345',
      })
      expect(onSuccess).toHaveBeenCalledWith('mock-jwt-id-token-12345')
    }
  })

  it('memverifikasi migrasi SQL sinkronisasi metadata profil Google terstruktur aman', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20261130000002_sync_google_profile_metadata.sql',
    )
    expect(fs.existsSync(migrationPath)).toBe(true)

    const sql = fs.readFileSync(migrationPath, 'utf-8')
    expect(sql).toContain('create or replace function public.handle_new_user()')
    expect(sql).toContain("raw_user_meta_data ->> 'avatar_url'")
    expect(sql).toContain("raw_user_meta_data ->> 'picture'")
    expect(sql).toContain('on conflict (user_id) do update set')
    expect(sql).toContain('coalesce(public.profiles.avatar_url, excluded.avatar_url)')
  })

  it('memastikan berkas composable useGoogleIdentity mematuhi batas 300 baris dan bebas em dash', () => {
    const filePath = path.join(process.cwd(), 'app', 'composables', 'useGoogleIdentity.ts')
    const code = fs.readFileSync(filePath, 'utf-8')
    const lines = code.split('\n')

    expect(lines.length).toBeLessThanOrEqual(300)
    expect(code.includes('\u2014')).toBe(false)
  })
})
