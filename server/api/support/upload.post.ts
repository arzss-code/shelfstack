import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~~/server/utils/auth'
import { detectImageMagicBytes } from '~~/server/utils/file-signature'
import { createAuthorizedSignedUrl } from '~~/server/utils/private-storage'
import { errorResponse, successResponse } from '~~/server/utils/response'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  try {
    const { user, profile } = await requireUser(event)
    const targetUserId = user.id || profile.user_id

    const parts = await readMultipartFormData(event)
    if (!parts || parts.length === 0) {
      return errorResponse(event, 'Tidak ada berkas yang diunggah.', null, 400)
    }

    const filePart = parts.find((p) => p.name === 'file' || p.name === 'proof' || p.filename)
    if (!filePart || !filePart.data || filePart.data.length === 0) {
      return errorResponse(event, 'Berkas foto lampiran wajib disertakan.', null, 400)
    }

    if (filePart.data.length > MAX_FILE_SIZE) {
      return errorResponse(
        event,
        'Ukuran file terlalu besar. Maksimal ukuran foto lampiran adalah 5 MB.',
        null,
        400,
      )
    }

    // Validasi fisik berkas (magic bytes) dan MIME type
    const detectedType = detectImageMagicBytes(filePart.data)
    const mimeType = detectedType || filePart.type?.toLowerCase() || ''
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return errorResponse(
        event,
        'Format file tidak valid atau rusak. Harap unggah foto asli berformat JPG, PNG, atau WEBP.',
        null,
        400,
      )
    }

    let ext = 'jpg'
    if (mimeType === 'image/png') ext = 'png'
    else if (mimeType === 'image/webp') ext = 'webp'

    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filePath = `${targetUserId}/${Date.now()}_${randomSuffix}.${ext}`

    const serviceClient = serverSupabaseServiceRole<Database>(event)

    const { error: uploadError } = await serviceClient.storage
      .from('chat-attachments')
      .upload(filePath, filePart.data, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return errorResponse(event, 'Gagal mengunggah foto lampiran.', uploadError.message, 500)
    }

    const { data: urlData } = serviceClient.storage.from('chat-attachments').getPublicUrl(filePath)
    const signedUrl = await createAuthorizedSignedUrl(
      serviceClient,
      'chat-attachments',
      filePath,
      urlData.publicUrl,
      3600,
    )

    return successResponse('Lampiran berhasil diunggah', {
      file_path: filePath,
      file_url: signedUrl,
      url: signedUrl,
      filename: filePart.filename || `lampiran_${Date.now()}.${ext}`,
      mime_type: mimeType,
      size: filePart.data.length,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan saat mengunggah lampiran.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
