import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { claimVoucherSchema } from '../../../../shared/schemas/user-voucher'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      return errorResponse(event, 'Sesi tidak valid. Silakan login kembali.', null, 401)
    }

    const body = await readBody(event)
    const validation = claimVoucherSchema.safeParse(body)
    if (!validation.success) {
      const issue = validation.error.issues[0]
      return errorResponse(
        event,
        issue?.message || 'Data klaim kupon tidak valid.',
        validation.error.format(),
        400,
      )
    }

    const { coupon_id, code } = validation.data
    const client = await serverSupabaseClient<Database>(event)

    // Panggil RPC claim_coupon_to_wallet
    const { data: claimResult, error: rpcError } = await client.rpc('claim_coupon_to_wallet', {
      p_coupon_id: coupon_id || null,
      p_code: code || null,
    })

    if (rpcError) {
      return errorResponse(event, rpcError.message || 'Gagal mengklaim voucher.', null, 400)
    }

    return successResponse('Voucher berhasil diklaim dan disimpan ke dompet Anda.', claimResult)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
    return errorResponse(event, 'Terjadi kesalahan internal saat mengklaim voucher.', message, 500)
  }
})
