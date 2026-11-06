import { z } from 'zod'
import { retryOrderExpiryDlqJob } from '../../../utils/order-service'

const retryDlqBodySchema = z.object({
  job_id: z.string().trim().min(1, 'job_id wajib diisi'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event).catch(() => null)
  const parsed = retryDlqBodySchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi permintaan retry DLQ gagal',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const result = await retryOrderExpiryDlqJob(parsed.data.job_id, event.context?.requestId)

  if (!result.ok) {
    return errorResponse(event, result.message, null, result.statusCode)
  }

  return successResponse(result.message, { job_id: parsed.data.job_id, retried: true })
})
