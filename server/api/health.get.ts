import { defineEventHandler } from 'h3'
import versionData from '../../version.json'

export default defineEventHandler(() => {
  return {
    status: 'success',
    message: 'ShelfStack Frontend process is healthy',
    data: {
      service: 'shelfstack-frontend',
      version: versionData.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    },
  }
})
