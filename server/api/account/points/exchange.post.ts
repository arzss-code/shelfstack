import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../utils/auth'
import { exchangeVoucherInputSchema } from '../../../../shared/schemas/loyalty-coin'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireUser(event)

    const body = await readBody(event)
    const validation = exchangeVoucherInputSchema.safeParse(body)
    if (!validation.success) {
      const issue = validation.error.issues[0]
      return errorResponse(
        event,
        issue?.message || 'Data penukaran kupon tidak valid.',
        validation.error.format(),
        400,
      )
    }

    const { coupon_id } = validation.data
    const client = await serverSupabaseClient<Database>(event)

    const { data, error: rpcError } = await client.rpc('exchange_coins_for_voucher', {
      p_coupon_id: coupon_id,
    })

    if (rpcError) {
      return errorResponse(event, rpcError.message || 'Gagal menukarkan koin.', null, 400)
    }

    const res = data as unknown as {
      success: boolean
      message: string
      coupon_code: string
      balance_coins: number
    }
    return successResponse(res.message || 'Voucher berhasil ditukarkan.', res)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && ('statusCode' in err || 'status' in err)) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
    return errorResponse(event, 'Terjadi kesalahan saat menukarkan koin.', message, 500)
  }
})
