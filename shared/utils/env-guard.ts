export interface EnvGuardIssue {
  variable: string
  hint: string
}

export type EnvGuardResult = { ok: true } | { ok: false; missing: EnvGuardIssue[] }

const REQUIRED_RUNTIME_ENV: EnvGuardIssue[] = [
  {
    variable: 'NUXT_PUBLIC_SUPABASE_URL',
    hint: 'URL proyek Supabase. Salin dari dashboard Supabase (lihat .env.example).',
  },
  {
    variable: 'NUXT_PUBLIC_SUPABASE_KEY',
    hint: 'Anon key proyek Supabase. Salin dari dashboard Supabase (lihat .env.example).',
  },
]

export function checkRequiredServerEnv(
  values: Record<string, string | undefined | null>,
): EnvGuardResult {
  const missing = REQUIRED_RUNTIME_ENV.filter(({ variable }) => {
    const value = values[variable]
    return !value || value.trim().length === 0
  })
  if (missing.length > 0) {
    return { ok: false, missing }
  }
  return { ok: true }
}

export function formatEnvGuardError(missing: EnvGuardIssue[]): string {
  const list = missing.map((item) => `- ${item.variable}: ${item.hint}`).join('\n')
  return (
    'Konfigurasi server belum lengkap sehingga aplikasi tidak dapat berjalan.\n' +
    `${list}\n` +
    'Salin .env.example menjadi .env lalu isi nilainya sebelum menjalankan server.'
  )
}
