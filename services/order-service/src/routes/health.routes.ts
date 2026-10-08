import type { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

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
}
