import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    (error: FastifyError | ZodError, request: FastifyRequest, reply: FastifyReply) => {
      // 1. Zod Validation Errors
      if (error instanceof ZodError) {
        return reply.status(400).send({
          status: 'error',
          message: 'Validasi data gagal',
          data: null,
          errors: error.flatten().fieldErrors,
        })
      }

      // 2. Fastify Validation Errors
      if ('validation' in error && error.validation) {
        return reply.status(400).send({
          status: 'error',
          message: 'Validasi skema request gagal',
          data: null,
          errors: error.validation,
        })
      }

      // 3. Known HTTP Status Code
      const statusCode =
        error.statusCode && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 500

      request.log.error({ err: error }, 'Unhandled server error in order-service')

      return reply.status(statusCode).send({
        status: 'error',
        message: error.message || 'Terjadi kesalahan pada server internal',
        data: null,
        errors: statusCode === 500 ? null : error,
      })
    },
  )
}
