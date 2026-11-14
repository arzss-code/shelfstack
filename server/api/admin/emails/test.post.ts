import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { dispatchTransactionalEmail } from '../../../utils/email-dispatcher'
import { errorResponse, successResponse } from '../../../utils/response'
import type { EmailOrderData } from '../../../../shared/utils/email-templates'

const testEmailSchema = z.object({
  recipient_email: z.string().email('Format email penerima tidak valid.'),
  template_type: z
    .enum(['order_placed', 'payment_success', 'order_shipped'])
    .default('order_placed'),
})

const sampleTestOrder: EmailOrderData = {
  id: 'ord-test-sample-01',
  customer_name: 'Penguji ShelfStack',
  customer_email: 'tester@example.com',
  customer_phone: '081234567890',
  street: 'Jl. Percobaan No. 1',
  city: 'Jakarta',
  postal: '10110',
  shipping_service: 'Reguler',
  courier_code: 'jne',
  tracking_number: 'SS-TEST-998877',
  items: [
    {
      name: 'ShelfStack Test Item (Headphone Studio)',
      quantity: 1,
      price: 1500000,
    },
  ],
  subtotal_cents: 150000000,
  shipping_fee_cents: 0,
  total_cents: 150000000,
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = testEmailSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi data email uji coba gagal.',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const { recipient_email: recipient, template_type: templateType } = parsed.data

  const result = await dispatchTransactionalEmail(
    templateType,
    {
      ...sampleTestOrder,
      customer_email: recipient,
    },
    {
      recipientEmail: recipient,
    },
  )

  if (!result.ok) {
    return errorResponse(
      event,
      `Gagal mengirim email (${result.provider}): ${result.error || 'Terjadi kesalahan pada provider email'}`,
      result,
      400,
    )
  }

  return successResponse(
    `Email uji coba berhasil dikirim ke ${recipient} via provider ${result.provider}.`,
    result,
  )
})
