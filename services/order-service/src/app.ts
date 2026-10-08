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
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  }).withTypeProvider<ZodTypeProvider>()

  // 1. Zod Compiler Setup
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // 2. Plugins
  await app.register(cors, {
    origin: true,
  })

  // 3. Global Error Handler
  setupErrorHandler(app)

  // 4. Routes
  await app.register(healthRoutes)
  await app.register(orderRoutes)

  return app
}
