import { z } from 'zod'
import { calculateShippingFee, shippingRateTiers } from '../../../shared/schemas/shipping'
import { formatRupiah } from '../../../app/utils/format'
import { errorResponse, successResponse } from '../../utils/response'

export const calculateShippingInputSchema = z.object({
  service: z.string().optional(),
  subtotal_cents: z.number().int().nonnegative().optional(),
  courier_code: z.string().optional(),
})

export type CalculateShippingInput = z.infer<typeof calculateShippingInputSchema>

export interface ShippingCalculationResult {
  service: string
  courier_code: string | null
  fee_cents: number
  is_free: boolean
  formatted_fee: string
  etd: string
}

export function processShippingCalculation(input: {
  service?: string | null
  subtotal_cents?: number
  courier_code?: string | null
}): ShippingCalculationResult {
  const calculated = calculateShippingFee(input.service, input.subtotal_cents)
  const tier = shippingRateTiers.find((t) => t.id === calculated.service) || shippingRateTiers[0]!

  const formattedFee = calculated.isFree ? 'Gratis' : formatRupiah(calculated.feeCents / 100)

  return {
    service: calculated.service,
    courier_code: input.courier_code || null,
    fee_cents: calculated.feeCents,
    is_free: calculated.isFree,
    formatted_fee: formattedFee,
    etd: tier.etd,
  }
}

export const handler = async (event: unknown) => {
  const method =
    typeof getMethod === 'function'
      ? getMethod(event as never)
      : (event as { method?: string })?.method || 'POST'

  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const body =
    typeof readBody === 'function'
      ? await readBody(event as never).catch(() => ({}))
      : (event as { body?: unknown })?.body || {}

  const parsed = calculateShippingInputSchema.safeParse(body || {})

  if (!parsed.success) {
    return errorResponse(
      event,
      'Parameter kalkulasi pengiriman tidak valid',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const data = processShippingCalculation(parsed.data)
  return successResponse('Kalkulasi ongkos kirim berhasil', data)
}

export default typeof defineEventHandler === 'function' ? defineEventHandler(handler) : handler
