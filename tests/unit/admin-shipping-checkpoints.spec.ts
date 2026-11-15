import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createShippingCheckpointSchema,
  defaultCheckpointTemplates,
} from '../../shared/schemas/shipping-checkpoint-input'
import { checkpointStatusTypes } from '../../shared/schemas/shipping'

describe('Admin Courier Logistics & Checkpoint Simulator', () => {
  describe('Zod Schema & Template Invariants', () => {
    it('validates a complete custom checkpoint payload successfully', () => {
      const validPayload = {
        status: 'in_transit',
        location: 'Hub Transit Surabaya',
        title: 'Paket Tiba di Fasilitas Sortir',
        description: 'Paket sedang disortir untuk diteruskan ke kurir area.',
      }

      const res = createShippingCheckpointSchema.safeParse(validPayload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.status).toBe('in_transit')
        expect(res.data.location).toBe('Hub Transit Surabaya')
      }
    })

    it('allows omitting title and description to use default templates', () => {
      const payload = {
        status: 'out_for_delivery',
        location: 'Kecamatan Tebet, Jakarta Selatan',
      }

      const res = createShippingCheckpointSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.title).toBeUndefined()
        expect(res.data.description).toBeUndefined()
      }
    })

    it('rejects invalid checkpoint status', () => {
      const invalidStatus = {
        status: 'teleported',
        location: 'Jakarta',
      }
      expect(createShippingCheckpointSchema.safeParse(invalidStatus).success).toBe(false)
    })

    it('rejects empty or whitespace-only location', () => {
      const emptyLoc = {
        status: 'picked_up',
        location: '   ',
      }
      expect(createShippingCheckpointSchema.safeParse(emptyLoc).success).toBe(false)
    })

    it('rejects location longer than 100 characters', () => {
      const tooLongLoc = {
        status: 'picked_up',
        location: 'A'.repeat(101),
      }
      expect(createShippingCheckpointSchema.safeParse(tooLongLoc).success).toBe(false)
    })

    it('provides default templates for all supported checkpoint statuses', () => {
      for (const status of checkpointStatusTypes) {
        const template = defaultCheckpointTemplates[status]
        expect(template, `Missing default template for status: ${status}`).toBeDefined()
        expect(template.defaultTitle.length).toBeGreaterThan(0)
        expect(template.defaultDescription.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Architectural Line Limits & Governance', () => {
    const files = [
      'shared/schemas/shipping-checkpoint-input.ts',
      'server/api/admin/orders/[id]/checkpoints.post.ts',
      'app/components/admin/orders/AdminAddCheckpointModal.vue',
      'app/pages/admin/orders/[id].vue',
      'tests/unit/admin-shipping-checkpoints.spec.ts',
    ]

    it('ensures all modified and created files are <= 300 lines', () => {
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines (${lines})`).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes in all modified and created files', () => {
      const emDash = String.fromCharCode(8212)
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(content.includes(emDash), `File ${file} contains forbidden em dash`).toBe(false)
      }
    })
  })
})
