import crypto from 'node:crypto'
import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { setupErrorHandler } from './plugins/error-handler.js'
import { healthRoutes } from './routes/health.routes.js'
import { orderRoutes } from './routes/order.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    requestIdHeader: false,
    genReqId: (req) => {
      const raw = req.headers['x-request-id'] || req.headers['request-id']
      if (typeof raw === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(raw.trim())) {
        return raw.trim()
      }
      return crypto.randomUUID()
    },
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'req.headers["x-internal-secret"]',
          'body.signature_key',
          'body.phone',
          'body.address',
        ],
        censor: '[REDACTED]',
      },
    },
  }).withTypeProvider<ZodTypeProvider>()

  // 1. Zod Compiler Setup
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // 2. Correlation Header Propagation Hook
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id)
    const rawCorrelation = request.headers['x-correlation-id']
    const correlationId =
      typeof rawCorrelation === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(rawCorrelation.trim())
        ? rawCorrelation.trim()
        : request.id
    reply.header('x-correlation-id', correlationId)
  })

  // 3. Plugins
  await app.register(cors, {
    origin: true,
  })

  // 4. Global Error Handler
  setupErrorHandler(app)

  // 5. Routes
  await app.register(healthRoutes)
  await app.register(orderRoutes)

  return app
}
