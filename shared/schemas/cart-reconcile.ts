import { z } from 'zod'

export const cartReconcileItemSchema = z.object({
  productId: z.number().int().positive('ID produk tidak valid'),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive('Kuantitas harus minimal 1'),
  priceCents: z.number().int().nonnegative().optional(),
})

export const cartReconcileRequestSchema = z.object({
  items: z.array(cartReconcileItemSchema).max(50, 'Maksimal 50 item per rekonsiliasi'),
})

export type CartReconcileItem = z.infer<typeof cartReconcileItemSchema>
export type CartReconcileRequest = z.infer<typeof cartReconcileRequestSchema>

export interface ReconciledItemResult {
  productId: number
  variantId?: string | null
  name: string
  requestedQuantity: number
  currentStock: number
  adjustedQuantity: number
  currentPriceCents: number
  previousPriceCents?: number
  priceChanged: boolean
  stockReduced: boolean
  isOutOfStock: boolean
  isUnavailable: boolean
}

export interface CartReconcileResponse {
  hasDrift: boolean
  items: ReconciledItemResult[]
  warnings: string[]
  hasOutOfStockItems: boolean
}
