import type { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'
import { isRedisReady } from '../cache/redis.client.js'
import { pingSupabase } from '../services/supabase.service.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    return {
      status: 'success',
      message: 'Order service is healthy',
      data: {
        service: '@shelfstack/order-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        nodeVersion: process.version,
      },
    }
  })

  app.get('/ready', async (_request, reply) => {
    const isDbUp = await pingSupabase(3000)
    const isRedisUp = isRedisReady()
    const timestamp = new Date().toISOString()

    if (!isDbUp) {
      return reply.status(503).send({
        status: 'error',
        message: 'Service not ready: database dependency is unavailable',
        data: {
          status: 'not_ready',
          service: '@shelfstack/order-service',
          timestamp,
          dependencies: {
            database: 'down',
            redis: isRedisUp ? 'up' : 'down',
          },
        },
      })
    }

    return reply.status(200).send({
      status: 'success',
      message: 'Order service is ready to serve traffic',
      data: {
        status: 'ready',
        service: '@shelfstack/order-service',
        timestamp,
        dependencies: {
          database: 'up',
          redis: isRedisUp ? 'up' : 'degraded',
        },
      },
    })
  })
}
