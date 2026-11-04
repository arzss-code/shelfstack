import { z } from 'zod'

export const supportSenderTypeSchema = z.enum(['customer', 'admin', 'system'], {
  message: 'Tipe pengirim pesan tidak valid',
})

export const supportAttachmentTypeSchema = z.enum(['image', 'order_card', 'product_card'], {
  message: 'Tipe lampiran pesan tidak valid',
})

export const supportThreadStatusSchema = z.enum(
  ['open', 'waiting_admin', 'waiting_customer', 'resolved'],
  {
    message: 'Status thread bantuan tidak valid',
  },
)

export const sendSupportMessageSchema = z.object({
  message_text: z
    .string()
    .trim()
    .min(1, 'Pesan tidak boleh kosong')
    .max(1000, 'Pesan maksimal 1000 karakter'),
  attachment_url: z.string().url('URL lampiran tidak valid').optional().nullable(),
  attachment_type: supportAttachmentTypeSchema.optional().nullable(),
  attached_order_id: z.string().uuid('ID pesanan tidak valid').optional().nullable(),
  attached_product_id: z
    .union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
    .optional()
    .nullable(),
})

export const adminSendSupportMessageSchema = z.object({
  message_text: z
    .string()
    .trim()
    .min(1, 'Balasan tidak boleh kosong')
    .max(1000, 'Balasan maksimal 1000 karakter'),
  attachment_url: z.string().url('URL lampiran tidak valid').optional().nullable(),
  attachment_type: z.enum(['image']).optional().nullable(),
})

export const updateThreadStatusSchema = z.object({
  status: supportThreadStatusSchema,
})

export const supportThreadQuerySchema = z.object({
  status: z
    .enum(['all', 'open', 'waiting_admin', 'waiting_customer', 'resolved'])
    .optional()
    .default('all'),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
})

export type SupportSenderType = z.infer<typeof supportSenderTypeSchema>
export type SupportAttachmentType = z.infer<typeof supportAttachmentTypeSchema>
export type SupportThreadStatus = z.infer<typeof supportThreadStatusSchema>
export type SendSupportMessageInput = z.infer<typeof sendSupportMessageSchema>
export type AdminSendSupportMessageInput = z.infer<typeof adminSendSupportMessageSchema>
export type UpdateThreadStatusInput = z.infer<typeof updateThreadStatusSchema>
export type SupportThreadQueryInput = z.infer<typeof supportThreadQuerySchema>

export interface SupportThreadItem {
  id: string
  customer_id: string
  status: SupportThreadStatus
  last_message_text: string | null
  last_message_at: string | null
  unread_by_customer_count: number
  unread_by_admin_count: number
  attached_order_id: string | null
  attached_product_id: number | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface SupportMessageItem {
  id: string
  thread_id: string
  sender_type: SupportSenderType
  sender_id: string | null
  message_text: string
  attachment_url: string | null
  attachment_type: SupportAttachmentType | null
  is_read: boolean
  created_at: string
  deleted_at?: string | null
}

export interface SupportThreadWithCustomer extends SupportThreadItem {
  customer_name: string
  customer_email: string
  customer_avatar_url: string | null
  total_orders?: number
}
