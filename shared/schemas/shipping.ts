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
