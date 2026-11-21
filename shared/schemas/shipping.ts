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

export const CENTRAL_JAVA_CITIES = [
  'semarang',
  'surakarta',
  'solo',
  'salatiga',
  'magelang',
  'pekalongan',
  'tegal',
  'kudus',
  'banyumas',
  'purwokerto',
  'cilacap',
  'klaten',
  'jepara',
  'pati',
  'boyolali',
  'sragen',
  'sukoharjo',
  'karanganyar',
  'wonogiri',
  'rembang',
  'blora',
  'grobogan',
  'demak',
  'temanggung',
  'kendal',
  'batang',
  'pemalang',
  'brebes',
  'kebumen',
  'purworejo',
  'banjarnegara',
  'purbalingga',
  'wonosobo',
]

export const JAVA_OTHER_PROVINCES = [
  'dki jakarta',
  'jakarta',
  'jawa barat',
  'west java',
  'jawa timur',
  'east java',
  'banten',
  'di yogyakarta',
  'yogyakarta',
  'daerah istimewa yogyakarta',
]

export const ZONE_SHIPPING_RATES: Record<
  ShippingZone,
  Record<ShippingService, { feeCents: number; available: boolean; etd: string }>
> = {
  central_java: {
    reguler: { feeCents: 1200000, available: true, etd: '1-2 Hari Kerja' },
    express: { feeCents: 2000000, available: true, etd: '1 Hari Kerja' },
    instant: { feeCents: 3000000, available: true, etd: 'Tiba Hari Ini' },
    cargo: { feeCents: 2000000, available: true, etd: '2-3 Hari Kerja' },
  },
  java_other: {
    reguler: { feeCents: 1600000, available: true, etd: '2-3 Hari Kerja' },
    express: { feeCents: 2800000, available: true, etd: '1-2 Hari Kerja' },
    instant: { feeCents: 4500000, available: true, etd: 'Tiba Hari Ini' },
    cargo: { feeCents: 2500000, available: true, etd: '3-5 Hari Kerja' },
  },
  outer_java: {
    reguler: { feeCents: 3200000, available: true, etd: '3-5 Hari Kerja' },
    express: { feeCents: 5000000, available: true, etd: '2-3 Hari Kerja' },
    instant: { feeCents: 0, available: false, etd: 'Tidak Tersedia' },
    cargo: { feeCents: 3800000, available: true, etd: '5-9 Hari Kerja' },
  },
}

export function resolveShippingZone(
  destination?: ShippingDestinationInput | string | null,
): ShippingZone | null {
  if (!destination) return null

  const text = (
    typeof destination === 'string'
      ? destination
      : `${destination.province || ''} ${destination.city || ''}`
  )
    .trim()
    .toLowerCase()

  if (!text) return null

  // 1. Cek Semarang dan Jawa Tengah (Warehouse Hub)
  if (
    text.includes('jawa tengah') ||
    text.includes('central java') ||
    CENTRAL_JAVA_CITIES.some((c) => text.includes(c))
  ) {
    return 'central_java'
  }

  // 2. Cek Pulau Jawa Lainnya
  if (
    JAVA_OTHER_PROVINCES.some((p) => text.includes(p)) ||
    text.includes('bandung') ||
    text.includes('surabaya') ||
    text.includes('bekasi') ||
    text.includes('tangerang') ||
    text.includes('bogor') ||
    text.includes('depok') ||
    text.includes('malang') ||
    text.includes('serang') ||
    text.includes('cirebon')
  ) {
    return 'java_other'
  }

  // 3. Wilayah Luar Jawa
  return 'outer_java'
}

export function getZoneShippingRateTiers(
  destination?: ShippingDestinationInput | string | null,
): ShippingRateTier[] {
  const zone = resolveShippingZone(destination)
  if (!zone) return shippingRateTiers

  const rates = ZONE_SHIPPING_RATES[zone]
  return [
    {
      id: 'reguler',
      name: 'Reguler',
      etd: rates.reguler.etd,
      baseFeeCents: rates.reguler.feeCents,
      freeThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
      description: 'Pengiriman standar terpercaya berbasis zonasi',
    },
    {
      id: 'express',
      name: 'Next Day / Kilat',
      etd: rates.express.etd,
      baseFeeCents: rates.express.feeCents,
      freeThresholdCents: null,
      description: 'Layanan prioritas cepat tiba keesokan hari',
    },
    {
      id: 'instant',
      name: 'Instan / Sameday',
      etd: rates.instant.etd,
      baseFeeCents: rates.instant.feeCents,
      freeThresholdCents: null,
      description: rates.instant.available
        ? 'Pengiriman langsung tiba di hari yang sama'
        : 'Layanan instan tidak tersedia untuk wilayah tujuan ini',
    },
    {
      id: 'cargo',
      name: 'Kargo Ekonomis',
      etd: rates.cargo.etd,
      baseFeeCents: rates.cargo.feeCents,
      freeThresholdCents: null,
      description: 'Pengiriman hemat untuk pesanan berbobot besar',
    },
  ]
}

export function calculateShippingFee(
  service?: string | null,
  subtotalCents?: number,
  destination?: ShippingDestinationInput | string | null,
): ShippingCalculationFeeResult {
  const normalized = (service || '').trim().toLowerCase()
  const subtotal = Math.max(0, subtotalCents ?? 0)
  const zone = resolveShippingZone(destination)

  // Default fallback tanpa tujuan spesifik (menjaga kompatibilitas penuh dengan tarif standar)
  if (!zone) {
    if (normalized === 'express') {
      return {
        service: 'express',
        feeCents: 3000000,
        isFree: false,
        isAvailable: true,
        etd: '1 Hari Kerja',
      }
    }

    if (normalized === 'instant') {
      return {
        service: 'instant',
        feeCents: 4500000,
        isFree: false,
        isAvailable: true,
        etd: 'Tiba Hari Ini',
      }
    }

    if (normalized === 'cargo') {
      return {
        service: 'cargo',
        feeCents: 2500000,
        isFree: false,
        isAvailable: true,
        etd: '4-7 Hari Kerja',
      }
    }

    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
    return {
      service: 'reguler',
      feeCents: isFree ? 0 : 1500000,
      isFree,
      isAvailable: true,
      etd: '2-3 Hari Kerja',
    }
  }

  // Kalkulasi berbasis zonasi geografis
  const validService: ShippingService =
    normalized === 'express' || normalized === 'instant' || normalized === 'cargo'
      ? normalized
      : 'reguler'

  const rateInfo = ZONE_SHIPPING_RATES[zone][validService]

  if (!rateInfo.available) {
    return {
      service: validService,
      feeCents: 0,
      isFree: false,
      zone,
      isAvailable: false,
      etd: rateInfo.etd,
    }
  }

  if (validService === 'reguler') {
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
    return {
      service: 'reguler',
      feeCents: isFree ? 0 : rateInfo.feeCents,
      isFree,
      zone,
      isAvailable: true,
      etd: rateInfo.etd,
    }
  }

  return {
    service: validService,
    feeCents: rateInfo.feeCents,
    isFree: false,
    zone,
    isAvailable: true,
    etd: rateInfo.etd,
  }
}
