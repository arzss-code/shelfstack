import { z } from 'zod'

export const returnReasonTypeSchema = z.enum(
  ['defective', 'damaged_in_transit', 'wrong_item', 'missing_accessories', 'other'],
  { message: 'Pilihan alasan kendala produk tidak valid.' },
)

export const returnSolutionTypeSchema = z.enum(['refund', 'replacement'], {
  message: 'Pilihan opsi resolusi tidak valid.',
})

export const returnRequestStatusSchema = z.enum(
  ['requested', 'approved', 'rejected', 'item_received', 'completed', 'cancelled'],
  { message: 'Status tiket retur tidak valid.' },
)

export const createReturnRequestSchema = z.object({
  reason_type: returnReasonTypeSchema,
  solution_type: returnSolutionTypeSchema,
  customer_notes: z
    .string()
    .trim()
    .min(20, 'Deskripsi kendala minimal 20 karakter agar tim kami dapat melakukan verifikasi.')
    .max(1000, 'Deskripsi kendala maksimal 1000 karakter.'),
  proof_image_urls: z
    .array(z.string().url('URL berkas bukti tidak valid.'))
    .min(1, 'Unggah minimal 1 foto bukti kondisi produk.')
    .max(3, 'Maksimal 3 foto bukti yang dapat dilampirkan.')
    .default([]),
  unboxing_video_url: z
    .string()
    .trim()
    .url('Tautan video unboxing harus berupa URL yang valid (Google Drive, YouTube, dll).')
    .or(z.literal(''))
    .optional()
    .nullable(),
})

export const updateReturnTrackingSchema = z.object({
  return_courier: z
    .string()
    .trim()
    .min(2, 'Nama ekspedisi kurir minimal 2 karakter.')
    .max(50, 'Nama ekspedisi kurir maksimal 50 karakter.'),
  return_tracking_number: z
    .string()
    .trim()
    .min(5, 'Nomor resi pengembalian minimal 5 karakter.')
    .max(50, 'Nomor resi pengembalian maksimal 50 karakter.')
    .regex(
      /^[A-Za-z0-9\-_]+$/,
      'Nomor resi hanya boleh berisi huruf, angka, strip, atau garis bawah.',
    ),
})

export const adminReviewReturnRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'item_received', 'completed'], {
    message: 'Status keputusan peninjauan tidak valid.',
  }),
  admin_notes: z.string().trim().max(1000, 'Catatan admin maksimal 1000 karakter.').optional(),
  replacement_courier: z.string().trim().max(50).optional(),
  replacement_tracking_number: z.string().trim().max(50).optional(),
  refund_amount_cents: z.number().int().min(0, 'Nominal refund tidak boleh negatif.').optional(),
  restock_inventory: z.boolean().default(false),
})

export type ReturnReasonType = z.infer<typeof returnReasonTypeSchema>
export type ReturnSolutionType = z.infer<typeof returnSolutionTypeSchema>
export type ReturnRequestStatus = z.infer<typeof returnRequestStatusSchema>
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>
export type UpdateReturnTrackingInput = z.infer<typeof updateReturnTrackingSchema>
export type AdminReviewReturnRequestInput = z.infer<typeof adminReviewReturnRequestSchema>

export interface ReturnRequestItem {
  id: string
  order_id: string
  user_id: string
  reason_type: ReturnReasonType
  solution_type: ReturnSolutionType
  status: ReturnRequestStatus
  customer_notes: string
  proof_image_urls: string[]
  unboxing_video_url: string | null
  return_courier: string | null
  return_tracking_number: string | null
  replacement_courier: string | null
  replacement_tracking_number: string | null
  admin_notes: string | null
  refund_amount_cents: number | null
  restocked_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  order_number?: string
  total_price_cents?: number
  customer_name?: string
  customer_email?: string
}
