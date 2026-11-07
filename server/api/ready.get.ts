import { defineEventHandler, setResponseStatus } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { checkReadiness } from '../utils/health'
import { logger } from '../utils/logger'
import { pingOrderService } from '../utils/order-service'
import versionData from '../../version.json'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole<Database>(event)

  const [dbResult, isOrderServiceUp] = await Promise.all([
    checkReadiness(async () => {
      const { error } = await client.from('categories').select('id').limit(1)
      if (error) throw new Error(error.message)
      return true
    }, 3000),
    pingOrderService(event.context?.requestId),
  ])

  const dependencies = {
    database: dbResult.isReady ? 'up' : 'down',
    order_service: isOrderServiceUp ? 'up' : 'down',
  }

  const timestamp = new Date().toISOString()

  if (!dbResult.isReady) {
    setResponseStatus(event, 503)
    logger.warn('[Readiness] Database connectivity check failed', {
      requestId: event.context?.requestId,
      dependencies,
    })
    return {
      status: 'error',
      message: 'Service not ready: database dependency is unavailable',
      data: {
        service: 'shelfstack-frontend',
        version: versionData.version,
        timestamp,
        dependencies,
      },
    }
  }

  return {
    status: 'success',
    message: 'ShelfStack Frontend is ready to serve traffic',
    data: {
      service: 'shelfstack-frontend',
      version: versionData.version,
      timestamp,
      dependencies,
    },
  }
})
