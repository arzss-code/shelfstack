import { checkRequiredServerEnv, formatEnvGuardError } from '../../shared/utils/env-guard'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const supabase = (config.public as Record<string, unknown> | undefined)?.supabase as
    { url?: unknown; key?: unknown } | undefined

  const result = checkRequiredServerEnv({
    NUXT_PUBLIC_SUPABASE_URL: typeof supabase?.url === 'string' ? supabase.url : undefined,
    NUXT_PUBLIC_SUPABASE_KEY: typeof supabase?.key === 'string' ? supabase.key : undefined,
  })

  if (!result.ok) {
    throw new Error(formatEnvGuardError(result.missing))
  }
})
