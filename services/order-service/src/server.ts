import { buildApp } from './app.js'
import { config } from './config.js'

async function start() {
  try {
    const app = await buildApp()

    await app.listen({
      port: config.PORT,
      host: config.HOST,
    })

    console.log(`[OrderService] Server running at http://${config.HOST}:${config.PORT}`)
  } catch (error) {
    console.error('[OrderService] Failed to start server:', error)
    process.exit(1)
  }
}

start()
