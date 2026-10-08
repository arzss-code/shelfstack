function isValidId(val: unknown): val is string {
  return typeof val === 'string' && val.trim() !== '' && val !== 'undefined'
}

/**
 * Ekstrak user UUID dari Supabase user/claims object secara defensif.
 * Di Nuxt Supabase v2 (serverSupabaseUser), payload JWT claims sering menggunakan field 'sub' (RFC 7519)
 * alih-alih 'id', sehingga pengecekan keduanya diperlukan untuk mencegah UUID syntax error ("undefined").
 */
export function extractAuthUserId(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const record = user as Record<string, unknown>

  if (isValidId(record.id)) {
    return record.id.trim()
  }

  if (isValidId(record.sub)) {
    return record.sub.trim()
  }

  return null
}
