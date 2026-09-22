import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export interface AuthProfile {
  id: string
  user_id: string
  full_name: string | null
  role: 'admin' | 'customer'
}

/** Ambil user + profile. Throw 401 jika belum login, 403 jika profil hilang. */
export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return errorResponse(event, 'Unauthorized. Silakan login dulu.', null, 401)
  }

  const client = await serverSupabaseClient<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, user_id, full_name, role')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    return errorResponse(event, 'Profil tidak ditemukan.', error, 403)
  }

  return { user, profile: profile as AuthProfile }
}

/** Throw 401/403 kecuali admin. RLS tetap enforce di DB (defense in depth). */
export async function requireAdmin(event: H3Event) {
  const { user, profile } = await requireUser(event)
  if (profile.role !== 'admin') {
    return errorResponse(event, 'Akses ditolak. Hanya admin.', null, 403)
  }
  return { user, profile }
}
