import { serverSupabaseClient } from '#supabase/server'
import { updateAddressSchema } from '../../../shared/schemas/address'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'PUT' && method !== 'DELETE') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const { user, profile } = await requireUser(event)
  const client = await serverSupabaseClient(event)
  const targetUserId = user.id || profile.user_id

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID alamat diperlukan', null, 400)
  }

  // Cari alamat yang aktif dan pastikan kepemilikannya
  const { data: existing, error: findError } = await (client as any)
    .from('user_addresses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) {
    return errorResponse(event, 'Gagal memeriksa alamat', findError, 500)
  }

  if (!existing) {
    return errorResponse(event, 'Alamat tidak ditemukan', null, 404)
  }

  if (existing.user_id !== targetUserId && profile.role !== 'admin') {
    return errorResponse(event, 'Akses alamat ditolak', null, 403)
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const parsed = updateAddressSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi data pembaruan alamat gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    // Jika alamat ini diubah menjadi alamat utama, reset is_default untuk alamat lainnya
    if (parsed.data.is_default === true) {
      await (client as any)
        .from('user_addresses')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('is_default', true)
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name.trim()
    if (parsed.data.phone !== undefined) updatePayload.phone = parsed.data.phone.trim()
    if (parsed.data.street !== undefined) updatePayload.street = parsed.data.street.trim()
    if (parsed.data.city !== undefined) updatePayload.city = parsed.data.city.trim()
    if (parsed.data.postal !== undefined) updatePayload.postal = parsed.data.postal.trim()
    if (parsed.data.note !== undefined) {
      updatePayload.note = parsed.data.note ? parsed.data.note.trim() : null
    }
    if (parsed.data.is_default !== undefined) {
      updatePayload.is_default = parsed.data.is_default
    }

    const { data: updated, error: updateError } = await (client as any)
      .from('user_addresses')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', targetUserId)
      .select('*')
      .single()

    if (updateError) {
      return errorResponse(event, 'Gagal memperbarui alamat', updateError, 500)
    }

    return successResponse('Alamat berhasil diperbarui', updated)
  }

  if (method === 'DELETE') {
    const { data: deleted, error: deleteError } = await (client as any)
      .from('user_addresses')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', targetUserId)
      .select('*')
      .single()

    if (deleteError) {
      return errorResponse(event, 'Gagal menghapus alamat', deleteError, 500)
    }

    // Jika alamat yang dihapus adalah alamat utama, jadikan salah satu alamat tersisa sebagai utama
    if (existing.is_default) {
      const { data: remaining } = await (client as any)
        .from('user_addresses')
        .select('id')
        .eq('user_id', targetUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (remaining && remaining.length > 0 && remaining[0]) {
        await (client as any)
          .from('user_addresses')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', remaining[0].id)
      }
    }

    return successResponse('Alamat berhasil dihapus', deleted)
  }
})
