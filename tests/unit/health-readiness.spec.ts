import { describe, expect, it } from 'vitest'
import { checkLiveness, checkReadiness } from '../../server/utils/health'

describe('Health and Readiness Probes (Core Logic)', () => {
  describe('Liveness Probe (checkLiveness)', () => {
    it('returns healthy status and process uptime without performing dependency queries', () => {
      const telemetry = checkLiveness()

      expect(telemetry.status).toBe('healthy')
      expect(telemetry.service).toBe('shelfstack-frontend')
      expect(typeof telemetry.uptime).toBe('number')
      expect(typeof telemetry.timestamp).toBe('string')
      expect(telemetry.environment).toBeDefined()
    })
  })

  describe('Readiness Probe (checkReadiness)', () => {
    it('returns ready status when database dependency ping succeeds', async () => {
      const mockDbPing = async () => true

      const { isReady, status } = await checkReadiness(mockDbPing, 1000)

      expect(isReady).toBe(true)
      expect(status.status).toBe('ready')
      expect(status.service).toBe('shelfstack-frontend')
      expect(status.dependencies.database).toBe('up')
      expect(typeof status.timestamp).toBe('string')
    })

    it('returns not_ready status when database dependency ping throws error', async () => {
      const mockDbPing = async () => {
        throw new Error('FATAL: connection refused at postgres://admin:secret@db.internal:5432')
      }

      const { isReady, status } = await checkReadiness(mockDbPing, 1000)

      expect(isReady).toBe(false)
      expect(status.status).toBe('not_ready')
      expect(status.service).toBe('shelfstack-frontend')
      expect(status.dependencies.database).toBe('down')

      // Ensure no raw connection string, user, or password leaked in status
      const serialized = JSON.stringify(status)
      expect(serialized).not.toContain('secret')
      expect(serialized).not.toContain('postgres://')
    })

    it('returns not_ready status when database dependency ping times out', async () => {
      const mockDbPing = async () => {
        // Simulates hung connection
        await new Promise((resolve) => setTimeout(resolve, 200))
        return true
      }

      // Strict 50ms timeout
      const { isReady, status } = await checkReadiness(mockDbPing, 50)

      expect(isReady).toBe(false)
      expect(status.status).toBe('not_ready')
      expect(status.dependencies.database).toBe('down')
    })
  })
})
