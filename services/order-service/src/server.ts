import { buildApp } from './app.js'
import { config } from './config.js'
import {
  closeOrderExpiryQueues,
  registerExpirySweepScheduler,
} from './queues/order-expiry.queue.js'
import {
  startOrderExpiryBullWorker,
  stopOrderExpiryBullWorker,
  type WorkerLogger,
} from './workers/order-expiry.worker.js'

async function start() {
  try {
    const app = await buildApp()

    const workerLogger: WorkerLogger = {
      info: (obj, msg) => app.log.info(obj, msg),
      warn: (obj, msg) => app.log.warn(obj, msg),
      error: (obj, msg) => app.log.error(obj, msg),
    }

    startOrderExpiryBullWorker(workerLogger)
    await registerExpirySweepScheduler().catch((err: unknown) => {
      app.log.warn({ err }, 'Failed to register BullMQ repeatable sweep scheduler on startup')
    })

    let isShuttingDown = false
    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) return
      isShuttingDown = true
      app.log.info({ signal }, 'Shutting down Order Service and BullMQ workers gracefully')

      try {
        await stopOrderExpiryBullWorker()
        await closeOrderExpiryQueues()
        await app.close()
        process.exit(0)
      } catch (err: unknown) {
        app.log.error({ err, signal }, 'Error during graceful shutdown')
        process.exit(1)
      }
    }

    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT')
    })
    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM')
    })

    await app.listen({
      port: config.PORT,
      host: config.HOST,
    })

    app.log.info(`OrderService running at http://${config.HOST}:${config.PORT}`)
  } catch (error) {
    console.error('[OrderService] Failed to start server:', error)
    process.exit(1)
  }
}

void start()
