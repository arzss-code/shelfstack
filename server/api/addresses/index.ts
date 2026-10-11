import { serverSupabaseClient } from '#supabase/server'
import { createAddressSchema } from '../../../shared/schemas/address'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)

  // Autentikasi wajib untuk semua operasi alamat pengguna
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  if (method === 'GET') {
    const { data, error } = await (client as any)
      .from('user_addresses')
      .select('*')
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse(event, 'Gagal memuat daftar alamat', error, 500)
    }

    return successResponse('Daftar alamat berhasil dimuat', data || [])
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const parsed = createAddressSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi data alamat gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    // Periksa apakah pengguna sudah memiliki alamat tersimpan sebelumnya
    const { count } = await (client as any)
      .from('user_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .is('deleted_at', null)

    const isFirstAddress = (count ?? 0) === 0
    const shouldBeDefault = Boolean(parsed.data.is_default) || isFirstAddress

    // Jika alamat baru ditandai sebagai utama, reset alamat utama sebelumnya
    if (shouldBeDefault) {
      await (client as any)
        .from('user_addresses')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('is_default', true)
    }

    const insertPayload = {
      user_id: targetUserId,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      street: parsed.data.street.trim(),
      city: parsed.data.city.trim(),
      postal: parsed.data.postal.trim(),
      note: parsed.data.note ? parsed.data.note.trim() : null,
      is_default: shouldBeDefault,
    }

    const { data, error } = await (client as any)
      .from('user_addresses')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      return errorResponse(event, 'Gagal menyimpan alamat baru', error, 500)
    }

    setResponseStatus(event, 201)
    return successResponse('Alamat berhasil disimpan', data)
  }

  return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
})
