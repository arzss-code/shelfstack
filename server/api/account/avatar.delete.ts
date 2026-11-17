import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { removeOwnedAvatar } from '../../utils/avatar-storage'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const serviceClient = serverSupabaseServiceRole<Database>(event)

  // 1. Ambil URL avatar lama
  const { data: currentProfile } = await serviceClient
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', targetUserId)
    .maybeSingle()

  const oldAvatarUrl = currentProfile?.avatar_url

  // 2. Set avatar_url menjadi null di public.profiles (service role bypass RLS)
  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({ avatar_url: null })
    .eq('user_id', targetUserId)

  if (updateError) {
    return errorResponse(event, 'Gagal menghapus foto profil.', updateError, 500)
  }

  await removeOwnedAvatar(serviceClient, targetUserId, oldAvatarUrl)

  // 4. Selaraskan user_metadata di auth Supabase
  try {
    await serviceClient.auth.admin.updateUserById(targetUserId, {
      user_metadata: { avatar_url: null },
    })
  } catch {
    // Fail-safe jika service role auth admin tidak tersedia
  }

  return successResponse('Foto profil berhasil dihapus', null)
})
