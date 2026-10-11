export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  service: string
  uptime: number
  timestamp: string
  environment: string
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready'
  service: string
  timestamp: string
  dependencies: {
    database: 'up' | 'down'
  }
}

/**
 * Liveness Check: verifies if the server process is alive.
 * Extremely fast, memory-only, no external dependency queries.
 */
export function checkLiveness(): HealthStatus {
  return {
    status: 'healthy',
    service: 'shelfstack-frontend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
}

/**
 * Readiness Check: verifies if the server is ready to accept traffic.
 * Checks critical dependencies (PostgreSQL/Supabase) with a strict bounded timeout.
 */
export async function checkReadiness(
  dbPingFn: () => Promise<boolean>,
  timeoutMs = 3000,
): Promise<{ isReady: boolean; status: ReadinessStatus }> {
  let isDatabaseUp: boolean

  try {
    const timeoutGuard = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connectivity check timed out')), timeoutMs)
    })

    await Promise.race([dbPingFn(), timeoutGuard])
    isDatabaseUp = true
  } catch {
    isDatabaseUp = false
  }

  const timestamp = new Date().toISOString()

  return {
    isReady: isDatabaseUp,
    status: {
      status: isDatabaseUp ? 'ready' : 'not_ready',
      service: 'shelfstack-frontend',
      timestamp,
      dependencies: {
        database: isDatabaseUp ? 'up' : 'down',
      },
    },
  }
}
