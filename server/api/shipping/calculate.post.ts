import { z } from 'zod'
import { calculateShippingFee, shippingRateTiers } from '../../../shared/schemas/shipping'
import { formatRupiah } from '../../../app/utils/format'
import { errorResponse, successResponse } from '../../utils/response'

export const calculateShippingInputSchema = z.object({
  service: z.string().optional(),
  subtotal_cents: z.number().int().nonnegative().optional(),
  courier_code: z.string().optional(),
  destination_city: z.string().optional(),
  destination_province: z.string().optional(),
})

export type CalculateShippingInput = z.infer<typeof calculateShippingInputSchema>

export interface ShippingCalculationResult {
  service: string
  courier_code: string | null
  fee_cents: number
  is_free: boolean
  formatted_fee: string
  etd: string
  zone?: string | null
  is_available?: boolean
}

export function processShippingCalculation(input: {
  service?: string | null
  subtotal_cents?: number
  courier_code?: string | null
  destination_city?: string | null
  destination_province?: string | null
}): ShippingCalculationResult {
  const destination =
    input.destination_city || input.destination_province
      ? { city: input.destination_city, province: input.destination_province }
      : null

  const calculated = calculateShippingFee(input.service, input.subtotal_cents, destination)
  const tier = shippingRateTiers.find((t) => t.id === calculated.service) || shippingRateTiers[0]!

  const formattedFee = calculated.isFree
    ? 'Gratis'
    : calculated.isAvailable === false
      ? 'Tidak Tersedia'
      : formatRupiah(calculated.feeCents / 100)

  return {
    service: calculated.service,
    courier_code: input.courier_code || null,
    fee_cents: calculated.feeCents,
    is_free: calculated.isFree,
    formatted_fee: formattedFee,
    etd: calculated.etd || tier.etd,
    zone: calculated.zone || null,
    is_available: calculated.isAvailable !== false,
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
