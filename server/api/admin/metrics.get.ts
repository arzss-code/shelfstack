import { metrics } from '../../utils/metrics'

export default defineEventHandler(async (event) => {
  // Secured: Admin authorization required
  await requireAdmin(event)

  const snapshot = metrics.getSnapshot()

  return successResponse('Operational metrics telemetry retrieved successfully', {
    metrics: snapshot,
    timestamp: new Date().toISOString(),
  })
})
