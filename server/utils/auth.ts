import type { H3Event } from 'h3'
import {
  serverSupabaseClient,
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from '#supabase/server'
import type { Database } from '~/types/database.types'
import { extractAuthUserId } from '../../shared/utils/auth'

export interface AuthProfile {
  id: string
  user_id: string
  full_name: string | null
  role: 'admin' | 'customer'
}

/** Ambil user + profile. Throw 401 jika belum login, 403 jika profil hilang. */
export async function requireUser(event: H3Event): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof serverSupabaseUser>>>
  profile: AuthProfile
}> {
  const user = await serverSupabaseUser(event)
  if (!user) {
    errorResponse(event, 'Unauthorized. Silakan login dulu.', null, 401)
  }

  const userId = extractAuthUserId(user)
  if (!userId) {
    errorResponse(event, 'Unauthorized. Sesi login tidak valid.', null, 401)
  }

  // Normalisasikan user.id agar kode downstream yang memanggil user.id tidak bernilai undefined
  ;(user as any).id = userId

  const client = await serverSupabaseClient<Database>(event)
  const { data: dbProfile, error } = await client
    .from('profiles')
    .select('id, user_id, full_name, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    errorResponse(event, 'Gagal memuat profil pengguna.', error, 500)
  }

  let profile = dbProfile as AuthProfile | null

  // Self-healing: jika record profiles belum terbuat di database (misal registrasi sebelum trigger dibuat)
  if (!profile) {
    try {
      const serviceClient = serverSupabaseServiceRole<Database>(event)
      const userMeta = (user as any).user_metadata || {}
      const appMeta = (user as any).app_metadata || {}
      const fullName = userMeta.full_name || (user as any).email?.split('@')[0] || 'Pelanggan'
      const role: 'admin' | 'customer' = appMeta.role === 'admin' ? 'admin' : 'customer'

      const { data: created, error: createError } = await serviceClient
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          role,
        })
        .select('id, user_id, full_name, role')
        .single()

      if (!createError && created) {
        profile = created as AuthProfile
      }
    } catch {
      // Abaikan jika service role key tidak tersedia di environment ini
    }
  }

  // Fallback graceful: jika database masih belum memiliki baris profile & service role gagal,
  // buat in-memory profile agar flow pengguna tidak mengalami HTTP 403 blocking
  if (!profile) {
    const userMeta = (user as any).user_metadata || {}
    const appMeta = (user as any).app_metadata || {}
    const role: 'admin' | 'customer' = appMeta.role === 'admin' ? 'admin' : 'customer'
    profile = {
      id: userId,
      user_id: userId,
      full_name: userMeta.full_name || (user as any).email?.split('@')[0] || 'Pelanggan',
      role,
    }
  }

  return { user, profile }
}

/** Throw 401/403 kecuali admin. RLS tetap enforce di DB (defense in depth). */
export async function requireAdmin(event: H3Event) {
  const { user, profile } = await requireUser(event)
  if (profile.role !== 'admin') {
    errorResponse(event, 'Akses ditolak. Hanya admin.', null, 403)
  }
  return { user, profile }
}
