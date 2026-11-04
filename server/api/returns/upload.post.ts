import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    return errorResponse(event, 'Tidak ada berkas yang diunggah.', null, 400)
  }

  const filePart = parts.find((p) => p.name === 'proof' || p.filename)
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    return errorResponse(event, 'Berkas foto bukti wajib disertakan.', null, 400)
  }

  // Validasi ukuran berkas (maks. 5 MB)
  if (filePart.data.length > MAX_FILE_SIZE) {
    return errorResponse(
      event,
      'Ukuran file terlalu besar. Maksimal ukuran foto bukti adalah 5 MB.',
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

  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const filePath = `${targetUserId}/${Date.now()}_${randomSuffix}.${ext}`

  const serviceClient = serverSupabaseServiceRole<Database>(event)

  // Upload ke Supabase Storage (bucket 'return-proofs')
  const { error: uploadError } = await serviceClient.storage
    .from('return-proofs')
    .upload(filePath, filePart.data, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    return errorResponse(event, 'Gagal mengunggah foto bukti retur.', uploadError.message, 500)
  }

  // Dapatkan URL publik file
  const { data: urlData } = serviceClient.storage.from('return-proofs').getPublicUrl(filePath)

  return successResponse('Foto bukti berhasil diunggah', {
    file_path: filePath,
    file_url: urlData.publicUrl,
  })
})
