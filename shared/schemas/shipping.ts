import { z } from 'zod'

export const supportedCouriers = [
  { code: 'jne', name: 'JNE Express' },
  { code: 'sicepat', name: 'SiCepat Ekspres' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'anteraja', name: 'Anteraja' },
  { code: 'pos', name: 'Pos Indonesia' },
] as const

export const courierCodeSchema = z.enum(['jne', 'sicepat', 'jnt', 'anteraja', 'pos'])
export type CourierCode = z.infer<typeof courierCodeSchema>

export const checkpointStatusTypes = [
  'manifested',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'returned',
] as const

export const checkpointStatusSchema = z.enum(checkpointStatusTypes)
export type CheckpointStatus = z.infer<typeof checkpointStatusSchema>

export const shippingCheckpointSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  tracking_number: z.string().min(1),
  status: checkpointStatusSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  created_at: z.string(),
})

export type ShippingCheckpoint = z.infer<typeof shippingCheckpointSchema>

export const shipOrderInputSchema = z.object({
  courier_code: courierCodeSchema,
  courier_name: z.string().min(1, 'Nama kurir wajib diisi'),
  tracking_number: z.string().min(3, 'Nomor resi minimal 3 karakter'),
})

export type ShipOrderInput = z.infer<typeof shipOrderInputSchema>

export const trackingLookupSchema = z.object({
  q: z.string().trim().min(3, 'Nomor resi atau ID pesanan minimal 3 karakter'),
})

export type TrackingLookupInput = z.infer<typeof trackingLookupSchema>

export const publicTrackingResultSchema = z.object({
  order_id: z.string().uuid(),
  tracking_number: z.string(),
  courier_code: courierCodeSchema,
  courier_name: z.string(),
  status: z.string(),
  recipient_name_masked: z.string(),
  recipient_phone_masked: z.string(),
  destination_city: z.string(),
  shipped_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  checkpoints: z.array(shippingCheckpointSchema),
})

export type PublicTrackingResult = z.infer<typeof publicTrackingResultSchema>

export const shippingServiceSchema = z.enum(['reguler', 'express', 'instant', 'cargo'])
export type ShippingService = z.infer<typeof shippingServiceSchema>

export interface ShippingRateTier {
  id: ShippingService
  name: string
  etd: string
  baseFeeCents: number
  freeThresholdCents: number | null
  description: string
}

export const shippingRateTiers: ShippingRateTier[] = [
  {
    id: 'reguler',
    name: 'Reguler',
    etd: '2-3 Hari Kerja',
    baseFeeCents: 1500000,
    freeThresholdCents: 50000000,
    description: 'Pengiriman standar terpercaya ke seluruh Indonesia',
  },
  {
    id: 'express',
    name: 'Next Day / Kilat',
    etd: '1 Hari Kerja',
    baseFeeCents: 3000000,
    freeThresholdCents: null,
    description: 'Layanan prioritas cepat tiba keesokan hari',
  },
  {
    id: 'instant',
    name: 'Instan / Sameday',
    etd: 'Tiba Hari Ini',
    baseFeeCents: 4500000,
    freeThresholdCents: null,
    description: 'Pengiriman langsung tiba di hari yang sama',
  },
  {
    id: 'cargo',
    name: 'Kargo Ekonomis',
    etd: '4-7 Hari Kerja',
    baseFeeCents: 2500000,
    freeThresholdCents: null,
    description: 'Pengiriman hemat untuk pesanan berbobot besar',
  },
]

export interface ShippingRateOption {
  service: ShippingService
  name: string
  description: string
  etd: string
  eta: string
  baseFeeCents: number
  freeShippingThresholdCents: number | null
}

export const FREE_SHIPPING_THRESHOLD_CENTS = 50000000

export const shippingRateOptions: Record<ShippingService, ShippingRateOption> = {
  reguler: {
    service: 'reguler',
    name: 'Reguler',
    description: 'Pengiriman standar terpercaya ke seluruh Indonesia',
    etd: '2-3 Hari Kerja',
    eta: '2-3 Hari Kerja',
    baseFeeCents: 1500000,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
  },
  express: {
    service: 'express',
    name: 'Next Day / Kilat',
    description: 'Layanan prioritas cepat tiba keesokan hari',
    etd: '1 Hari Kerja',
    eta: '1 Hari Kerja',
    baseFeeCents: 3000000,
    freeShippingThresholdCents: null,
  },
  instant: {
    service: 'instant',
    name: 'Instan / Sameday',
    description: 'Pengiriman langsung tiba di hari yang sama',
    etd: 'Tiba Hari Ini',
    eta: 'Tiba Hari Ini',
    baseFeeCents: 4500000,
    freeShippingThresholdCents: null,
  },
  cargo: {
    service: 'cargo',
    name: 'Kargo Ekonomis',
    description: 'Pengiriman hemat untuk pesanan berbobot besar',
    etd: '4-7 Hari Kerja',
    eta: '4-7 Hari Kerja',
    baseFeeCents: 2500000,
    freeShippingThresholdCents: null,
  },
}

export function calculateShippingFee(
  service?: string | null,
  subtotalCents?: number,
): { feeCents: number; isFree: boolean; service: ShippingService } {
  const normalized = (service || '').trim().toLowerCase()
  const subtotal = Math.max(0, subtotalCents ?? 0)

  if (normalized === 'express') {
    return {
      service: 'express',
      feeCents: 3000000,
      isFree: false,
    }
  }

  if (normalized === 'instant') {
    return {
      service: 'instant',
      feeCents: 4500000,
      isFree: false,
    }
  }

  if (normalized === 'cargo') {
    return {
      service: 'cargo',
      feeCents: 2500000,
      isFree: false,
    }
  }

  // Reguler default
  const isFree = subtotal >= 50000000
  return {
    service: 'reguler',
    feeCents: isFree ? 0 : 1500000,
    isFree,
  }
}
