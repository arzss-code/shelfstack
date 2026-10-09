import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { checkReadiness } from '../utils/health'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole<Database>(event)

  const { isReady, status } = await checkReadiness(async () => {
    const { error } = await client.from('categories').select('id').limit(1)
    if (error) throw new Error(error.message)
    return true
  }, 3000)

  if (!isReady) {
    setResponseStatus(event, 503)
    logger.warn('[Readiness] Database connectivity check failed', {
      requestId: event.context?.requestId,
    })
    return {
      status: 'error',
      message: 'Service not ready: database dependency is unavailable',
      data: status,
    }
  }

  return {
    status: 'success',
    message: 'ShelfStack Frontend is ready to serve traffic',
    data: status,
  }
})
