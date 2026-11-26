import { z } from 'zod'

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

export const FREE_SHIPPING_THRESHOLD_CENTS = 50000000

export const shippingRateTiers: ShippingRateTier[] = [
  {
    id: 'reguler',
    name: 'Reguler',
    etd: '2-3 Hari Kerja',
    baseFeeCents: 1500000,
    freeThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
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

export type ShippingZone = 'central_java' | 'java_other' | 'outer_java'

export interface ShippingDestinationInput {
  province?: string | null
  city?: string | null
}

export interface ShippingCalculationFeeResult {
  feeCents: number
  isFree: boolean
  service: ShippingService
  zone?: ShippingZone
  isAvailable?: boolean
  etd?: string
}
