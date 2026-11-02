import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { updateProfileSchema } from '../../../shared/schemas/profile'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const body = await readBody(event)
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi data profil gagal',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const client = await serverSupabaseClient<Database>(event)
  const updatePayload: Record<string, string | null> = {}
  const metadataPayload: Record<string, string | null> = {}

  if (parsed.data.full_name !== undefined) {
    const trimmed = parsed.data.full_name.trim()
    updatePayload.full_name = trimmed
    metadataPayload.full_name = trimmed
  }

  if (parsed.data.avatar_url !== undefined) {
    updatePayload.avatar_url = parsed.data.avatar_url
    metadataPayload.avatar_url = parsed.data.avatar_url
  }

  // Update profil di tabel public.profiles
  const { data: updatedProfile, error: updateError } = await (client as any)
    .from('profiles')
    .update(updatePayload)
    .eq('user_id', targetUserId)
    .select('id, user_id, full_name, role, avatar_url')
    .single()

  if (updateError) {
    return errorResponse(event, 'Gagal memperbarui profil pengguna', updateError, 500)
  }

  // Selaraskan metadata auth Supabase (fail-safe)
  try {
    const serviceClient = serverSupabaseServiceRole<Database>(event)
    await (serviceClient as any).auth.admin.updateUserById(targetUserId, {
      user_metadata: metadataPayload,
    })
  } catch {
    // Abaikan jika service role key tidak tersedia di lingkungan saat ini
  }

  return successResponse('Profil berhasil diperbarui', updatedProfile)
})
