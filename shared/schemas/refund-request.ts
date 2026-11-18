import { z } from 'zod'

export const customerRefundRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan pembatalan minimal 5 karakter')
    .max(300, 'Alasan pembatalan maksimal 300 karakter'),
})

export type CustomerRefundRequestInput = z.infer<typeof customerRefundRequestSchema>
