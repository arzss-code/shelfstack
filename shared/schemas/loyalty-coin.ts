import { z } from 'zod'

export const coinTransactionTypeSchema = z.enum([
  'earned',
  'spent',
  'redeemed_voucher',
  'welcome_bonus',
  'refunded_order',
  'cancelled_order',
])

export type CoinTransactionType = z.infer<typeof coinTransactionTypeSchema>

export const coinTransactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: coinTransactionTypeSchema,
  amount_coins: z.number().int().positive(),
  balance_after: z.number().int().nonnegative(),
  order_id: z.string().nullable().optional(),
  coupon_id: z.string().nullable().optional(),
  description: z.string(),
  created_at: z.string(),
  formatted_amount: z.string().optional(),
  formatted_date: z.string().optional(),
})

export type CoinTransaction = z.infer<typeof coinTransactionSchema>

export const userCoinsSummarySchema = z.object({
  balance_coins: z.number().int().nonnegative(),
  lifetime_earned_coins: z.number().int().nonnegative(),
  lifetime_spent_coins: z.number().int().nonnegative(),
  has_claimed_welcome: z.boolean(),
  formatted_balance: z.string(),
  rupiah_value: z.number().int().nonnegative(),
  formatted_rupiah: z.string(),
  recent_transactions: z.array(coinTransactionSchema),
})

export type UserCoinsSummary = z.infer<typeof userCoinsSummarySchema>

export const exchangeVoucherInputSchema = z.object({
  coupon_id: z.string().uuid('ID kupon harus berformat UUID yang valid.'),
})

export type ExchangeVoucherInput = z.infer<typeof exchangeVoucherInputSchema>

export const coinExchangeCatalogItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().int(),
  formatted_discount: z.string(),
  min_purchase_cents: z.number().int(),
  formatted_min_purchase: z.string(),
  max_discount_cents: z.number().int().nullable().optional(),
  formatted_max_discount: z.string().nullable().optional(),
  coin_cost: z.number().int().positive(),
  formatted_coin_cost: z.string(),
  is_claimed: z.boolean(),
  expires_at: z.string().nullable().optional(),
})

export type CoinExchangeCatalogItem = z.infer<typeof coinExchangeCatalogItemSchema>
