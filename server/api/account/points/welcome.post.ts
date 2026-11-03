import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireUser(event)
    const client = await serverSupabaseClient<Database>(event)

    const { data, error: rpcError } = await client.rpc('claim_welcome_coins')

    if (rpcError) {
      return errorResponse(event, rpcError.message || 'Gagal mengklaim bonus sambutan.', null, 400)
    }

    const res = data as unknown as { success: boolean; message: string; balance_coins: number }
    return successResponse(res.message || 'Bonus sambutan berhasil diklaim.', res)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && ('statusCode' in err || 'status' in err)) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
    return errorResponse(event, 'Terjadi kesalahan saat mengklaim bonus sambutan.', message, 500)
  }
})
