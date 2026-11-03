import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { requireUser } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/response'
import { logger } from '../../../utils/logger'
import type {
  CoinTransaction,
  CoinTransactionType,
  UserCoinsSummary,
} from '../../../../shared/schemas/loyalty-coin'

interface UserCoinsRow {
  balance_coins: number
  lifetime_earned_coins: number
  lifetime_spent_coins: number
  has_claimed_welcome: boolean
}

interface CoinTransactionRow {
  id: string
  user_id: string
  type: CoinTransactionType
  amount_coins: number
  balance_after: number
  order_id: string | null
  coupon_id: string | null
  description: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  try {
    const { user, profile } = await requireUser(event)
    const targetUserId = user.id || profile.user_id

    const client = await serverSupabaseClient<Database>(event)

    // 1. Ambil ringkasan saldo koin pengguna
    const { data: userCoins, error: coinError } = await client
      .from('user_coins')
      .select('balance_coins, lifetime_earned_coins, lifetime_spent_coins, has_claimed_welcome')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (coinError) {
      const isMissingTable =
        coinError.code === '42P01' ||
        coinError.code === 'PGRST205' ||
        coinError.message?.includes('does not exist') ||
        coinError.message?.includes('schema cache')

      if (isMissingTable) {
        logger.warn(
          '[Loyalty Points] Tabel public.user_coins belum tersedia di database. Pastikan migrasi 20261127000001_loyalty_coins_and_rewards.sql telah dijalankan.',
          { error: coinError.message },
        )
      } else {
        return errorResponse(event, 'Gagal mengambil data saldo koin.', coinError.message, 500)
      }
    }

    const coinsData: UserCoinsRow = (userCoins as unknown as UserCoinsRow) || {
      balance_coins: 0,
      lifetime_earned_coins: 0,
      lifetime_spent_coins: 0,
      has_claimed_welcome: false,
    }

    // 2. Ambil riwayat mutasi transaksi koin terbaru (maksimal 20)
    const { data: rawTx, error: txError } = await client
      .from('coin_transactions')
      .select(
        'id, user_id, type, amount_coins, balance_after, order_id, coupon_id, description, created_at',
      )
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (txError) {
      const isMissingTable =
        txError.code === '42P01' ||
        txError.code === 'PGRST205' ||
        txError.message?.includes('does not exist') ||
        txError.message?.includes('schema cache')

      if (isMissingTable) {
        logger.warn('[Loyalty Points] Tabel public.coin_transactions belum tersedia di database.', {
          error: txError.message,
        })
      } else {
        return errorResponse(event, 'Gagal mengambil riwayat transaksi koin.', txError.message, 500)
      }
    }

    const transactions: CoinTransaction[] = ((rawTx || []) as unknown as CoinTransactionRow[]).map(
      (tx) => {
        const isCredit = ['earned', 'welcome_bonus', 'refunded_order'].includes(tx.type)
        const prefix = isCredit ? '+' : '-'
        const formattedAmount = `${prefix}${new Intl.NumberFormat('id-ID').format(tx.amount_coins)} Koin`
        const dateObj = new Date(tx.created_at)
        const formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : tx.created_at

        return {
          id: tx.id,
          user_id: tx.user_id,
          type: tx.type,
          amount_coins: tx.amount_coins,
          balance_after: tx.balance_after,
          order_id: tx.order_id,
          coupon_id: tx.coupon_id,
          description: tx.description,
          created_at: tx.created_at,
          formatted_amount: formattedAmount,
          formatted_date: formattedDate,
        }
      },
    )

    const balance = coinsData.balance_coins || 0
    const summary: UserCoinsSummary = {
      balance_coins: balance,
      lifetime_earned_coins: coinsData.lifetime_earned_coins || 0,
      lifetime_spent_coins: coinsData.lifetime_spent_coins || 0,
      has_claimed_welcome: Boolean(coinsData.has_claimed_welcome),
      formatted_balance: `${new Intl.NumberFormat('id-ID').format(balance)} Koin`,
      rupiah_value: balance,
      formatted_rupiah: formatRupiah(balance),
      recent_transactions: transactions,
    }

    return successResponse('Data koin berhasil dimuat.', summary)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && ('statusCode' in err || 'status' in err)) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
    return errorResponse(event, 'Terjadi kesalahan saat memuat data koin.', message, 500)
  }
})
