import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    return errorResponse(event, 'Tidak ada berkas yang diunggah.', null, 400)
  }

  const filePart = parts.find((p) => p.name === 'avatar' || p.filename)
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    return errorResponse(event, 'Berkas foto profil wajib disertakan.', null, 400)
  }

  // Validasi ukuran berkas (maks. 2 MB)
  if (filePart.data.length > MAX_FILE_SIZE) {
    return errorResponse(
      event,
      'Ukuran file terlalu besar. Maksimal ukuran file adalah 2 MB.',
      null,
      400,
    )
  }

  // Validasi MIME type
  const mimeType = filePart.type?.toLowerCase() || 'image/jpeg'
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return errorResponse(
      event,
      'Format file tidak didukung. Harap unggah foto dengan format JPG, PNG, atau WEBP.',
      null,
      400,
    )
  }

  // Ekstensi berkas
  let ext = 'jpg'
  if (mimeType === 'image/png') ext = 'png'
  else if (mimeType === 'image/webp') ext = 'webp'

  const filePath = `${targetUserId}/${Date.now()}.${ext}`

  const serviceClient = serverSupabaseServiceRole<Database>(event)

  // 1. Upload ke Supabase Storage (bucket 'avatars')
  const { error: uploadError } = await serviceClient.storage
    .from('avatars')
    .upload(filePath, filePart.data, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    return errorResponse(
      event,
      'Gagal menyimpan foto profil ke penyimpanan cloud.',
      uploadError.message,
      500,
    )
  }

  // 2. Dapatkan public URL
  const { data: publicUrlData } = serviceClient.storage.from('avatars').getPublicUrl(filePath)
  const newAvatarUrl = publicUrlData.publicUrl

  // 3. Ambil avatar lama untuk dibersihkan
  const { data: currentProfile } = await (serviceClient as any)
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', targetUserId)
    .maybeSingle()

  const oldAvatarUrl = currentProfile?.avatar_url

  // 4. Update avatar_url di tabel public.profiles (service role bypass RLS)
  const { error: updateError } = await (serviceClient as any)
    .from('profiles')
    .update({ avatar_url: newAvatarUrl })
    .eq('user_id', targetUserId)

  if (updateError) {
    return errorResponse(event, 'Gagal memperbarui profil pengguna.', updateError, 500)
  }

  // 5. Bersihkan berkas lama dari storage jika ada
  if (oldAvatarUrl && oldAvatarUrl.includes('/avatars/')) {
    const oldPath = oldAvatarUrl.split('/avatars/')[1]
    if (oldPath && oldPath !== filePath) {
      await serviceClient.storage.from('avatars').remove([oldPath])
    }
  }

  // 6. Selaraskan user_metadata di auth Supabase
  try {
    await (serviceClient as any).auth.admin.updateUserById(targetUserId, {
      user_metadata: { avatar_url: newAvatarUrl },
    })
  } catch {
    // Fail-safe jika service role auth admin tidak tersedia
  }

  return successResponse('Foto profil berhasil diunggah', {
    avatar_url: newAvatarUrl,
  })
})
