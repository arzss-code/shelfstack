import { z } from 'zod'

export const notificationTypes = [
  'order_created',
  'payment_success',
  'order_shipped',
  'order_cancelled',
  'order_completed',
  'system',
] as const

export const notificationTypeSchema = z.enum(notificationTypes)
export type NotificationType = z.infer<typeof notificationTypeSchema>

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: notificationTypeSchema,
  reference_id: z.string().nullable().optional(),
  reference_url: z.string().nullable().optional(),
  is_read: z.boolean(),
  read_at: z.string().nullable().optional(),
  created_at: z.string(),
})

export type NotificationItem = z.infer<typeof notificationItemSchema>

export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1, { message: 'Judul notifikasi wajib diisi' }),
  message: z.string().min(1, { message: 'Pesan notifikasi wajib diisi' }),
  type: notificationTypeSchema,
  reference_id: z.string().nullable().optional(),
  reference_url: z.string().nullable().optional(),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>

export const markNotificationReadSchema = z.object({
  is_read: z.boolean().default(true),
})

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>
