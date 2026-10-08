export default defineEventHandler(() => {
  return {
    status: 'success',
    message: 'ShelfStack Frontend is healthy',
    data: {
      service: 'shelfstack-frontend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
  }
})
