import { requireAdmin } from '../../../utils/auth'
import { getEmailDeliveryLogs } from '../../../utils/email-dispatcher'
import { successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const logs = getEmailDeliveryLogs()
  return successResponse('Log pengiriman email transaksional berhasil dimuat', {
    logs,
    total: logs.length,
  })
})
