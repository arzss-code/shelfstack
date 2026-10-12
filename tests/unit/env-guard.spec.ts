import { describe, it, expect } from 'vitest'
import { checkRequiredServerEnv, formatEnvGuardError } from '../../shared/utils/env-guard'

describe('Validasi Konfigurasi Server (env-guard)', () => {
  it('lolos saat URL dan key Supabase terisi', () => {
    const res = checkRequiredServerEnv({
      NUXT_PUBLIC_SUPABASE_URL: 'https://xyz.supabase.co',
      NUXT_PUBLIC_SUPABASE_KEY: 'anon-key',
    })
    expect(res.ok).toBe(true)
  })

  it('menolak saat URL kosong dan menyebut nama variabelnya', () => {
    const res = checkRequiredServerEnv({
      NUXT_PUBLIC_SUPABASE_URL: '',
      NUXT_PUBLIC_SUPABASE_KEY: 'anon-key',
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.missing.map((m) => m.variable)).toContain('NUXT_PUBLIC_SUPABASE_URL')
    }
  })

  it('menolak string kosong, spasi, undefined, dan null', () => {
    for (const bad of ['', '   ', undefined, null]) {
      const res = checkRequiredServerEnv({
        NUXT_PUBLIC_SUPABASE_URL: bad,
        NUXT_PUBLIC_SUPABASE_KEY: bad,
      })
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.missing).toHaveLength(2)
      }
    }
  })

  it('memformat pesan error yang menyebut variabel dan cara memperbaiki', () => {
    const message = formatEnvGuardError([
      { variable: 'NUXT_PUBLIC_SUPABASE_URL', hint: 'Isi dari dashboard.' },
    ])
    expect(message).toContain('NUXT_PUBLIC_SUPABASE_URL')
    expect(message).toContain('.env.example')
  })
})
