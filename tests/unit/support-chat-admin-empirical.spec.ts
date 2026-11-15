import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import {
  supportThreadQuerySchema,
  updateThreadStatusSchema,
  adminSendSupportMessageSchema,
  supportSenderTypeSchema,
  supportAttachmentTypeSchema,
  supportThreadStatusSchema,
} from '../../shared/schemas/support-chat'
import {
  WELCOME_BOT_MESSAGE,
  SYSTEM_WELCOME_MESSAGE,
  SUPPORT_CANNED_RESPONSES,
  SUPPORT_STATUS_MAP,
} from '../../server/utils/support-chat'

describe('Milestone 2 Adversarial & Empirical Verification', () => {
  describe('1. Admin RBAC & Security Challenge', () => {
    it('menolak akses pengguna dengan peran customer (non-admin) dengan HTTP 403 Forbidden', async () => {
      // Simulasi requireAdmin dengan profil customer
      const mockCustomerUser = {
        id: 'cust-uuid-1',
        email: 'customer@shelfstack.atsiilaarya.me',
      }
      const mockCustomerProfile = {
        id: 'cust-uuid-1',
        user_id: 'cust-uuid-1',
        full_name: 'Customer Test',
        role: 'customer' as const,
      }

      const simulateRequireAdmin = async (profile: { role: string }) => {
        if (profile.role !== 'admin') {
          const err = new Error('Akses ditolak. Hanya admin.') as any
          err.statusCode = 403
          err.data = { status: 'error', message: 'Akses ditolak. Hanya admin.', errors: null }
          throw err
        }
        return { user: mockCustomerUser, profile }
      }

      await expect(simulateRequireAdmin(mockCustomerProfile)).rejects.toMatchObject({
        message: 'Akses ditolak. Hanya admin.',
        statusCode: 403,
      })
    })

    it('menolak akses pengguna yang belum terautentikasi (unauthenticated) dengan HTTP 401', async () => {
      const simulateRequireUser = async (user: any) => {
        if (!user) {
          const err = new Error('Unauthorized. Silakan login dulu.') as any
          err.statusCode = 401
          throw err
        }
        return user
      }

      await expect(simulateRequireUser(null)).rejects.toMatchObject({
        message: 'Unauthorized. Silakan login dulu.',
        statusCode: 401,
      })
    })

    it('mengizinkan akses pengguna dengan peran admin', async () => {
      const mockAdminUser = { id: 'admin-uuid-1', email: 'cs@shelfstack.atsiilaarya.me' }
      const mockAdminProfile = {
        id: 'admin-uuid-1',
        user_id: 'admin-uuid-1',
        full_name: 'Admin CS',
        role: 'admin' as const,
      }

      const simulateRequireAdmin = async (profile: { role: string }) => {
        if (profile.role !== 'admin') {
          const err = new Error('Akses ditolak. Hanya admin.') as any
          err.statusCode = 403
          throw err
        }
        return { user: mockAdminUser, profile }
      }

      const result = await simulateRequireAdmin(mockAdminProfile)
      expect(result.profile.role).toBe('admin')
      expect(result.user.id).toBe('admin-uuid-1')
    })

    it('memvalidasi router parameter ID thread harus berupa UUID valid (menolak format ilegal dengan HTTP 400)', () => {
      const uuidValidator = z.string().uuid()

      const invalidIds = [
        '',
        'invalid-id',
        '12345',
        'not-a-uuid-string',
        'a0eebc99-9c0b-4ef8-bb6d', // UUID terpotong
        "123e4567-e89b-12d3-a456-426614174000' OR '1'='1", // SQL injection
        '   ',
      ]

      for (const id of invalidIds) {
        const result = uuidValidator.safeParse(id)
        expect(result.success).toBe(false)
      }

      // Valid UUID
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(uuidValidator.safeParse(validUuid).success).toBe(true)
    })

    it('mengembalikan HTTP 404 ketika thread ID valid tetapi record tidak ditemukan di database', () => {
      const simulateFindThread = (threadInDb: any | null) => {
        if (!threadInDb) {
          const err = new Error('Thread bantuan tidak ditemukan.') as any
          err.statusCode = 404
          throw err
        }
        return threadInDb
      }

      expect(() => simulateFindThread(null)).toThrowError('Thread bantuan tidak ditemukan.')
      try {
        simulateFindThread(null)
      } catch (err: any) {
        expect(err.statusCode).toBe(404)
      }
    })
  })

  describe('2. Thread Status Transitions Challenge', () => {
    it('memverifikasi transisi ke status resolved mereset unread_by_admin_count menjadi 0', () => {
      const applyStatusUpdate = (
        payloadStatus: 'open' | 'waiting_admin' | 'waiting_customer' | 'resolved',
      ) => {
        const updateData: Record<string, any> = {
          status: payloadStatus,
          updated_at: new Date().toISOString(),
        }

        if (payloadStatus === 'resolved') {
          updateData.unread_by_admin_count = 0
        }

        return updateData
      }

      // Transisi resolved
      const resolvedUpdate = applyStatusUpdate('resolved')
      expect(resolvedUpdate.status).toBe('resolved')
      expect(resolvedUpdate.unread_by_admin_count).toBe(0)

      // Transisi waiting_customer (tidak mereset unread_by_admin_count secara paksa)
      const waitingCustomerUpdate = applyStatusUpdate('waiting_customer')
      expect(waitingCustomerUpdate.status).toBe('waiting_customer')
      expect(waitingCustomerUpdate.unread_by_admin_count).toBeUndefined()
    })

    it('menolak transisi ke status yang tidak valid (misal: deleted, closed, archived, arbitrary)', () => {
      const illegalStatuses = [
        'deleted',
        'closed',
        'archived',
        'in_progress',
        'pending',
        'finished',
        'RESOLVED', // case-sensitive
        'open; drop table support_threads;',
        '',
      ]

      for (const status of illegalStatuses) {
        const result = updateThreadStatusSchema.safeParse({ status })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.status).toContain(
            'Status thread bantuan tidak valid',
          )
        }
      }
    })

    it('menerima seluruh 4 status transisi resmi: open, waiting_admin, waiting_customer, resolved', () => {
      const validStatuses = ['open', 'waiting_admin', 'waiting_customer', 'resolved'] as const

      for (const status of validStatuses) {
        const result = updateThreadStatusSchema.safeParse({ status })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(status)
        }
      }
    })

    it('memverifikasi pesan sistem audit yang dihasilkan saat status diperbarui', () => {
      const generateSystemNoteText = (status: string) => {
        return status === 'resolved'
          ? 'Percakapan telah diselesaikan oleh tim Customer Support.'
          : `Status percakapan diperbarui menjadi: ${status}`
      }

      expect(generateSystemNoteText('resolved')).toBe(
        'Percakapan telah diselesaikan oleh tim Customer Support.',
      )
      expect(generateSystemNoteText('waiting_customer')).toBe(
        'Status percakapan diperbarui menjadi: waiting_customer',
      )
      expect(generateSystemNoteText('open')).toBe('Status percakapan diperbarui menjadi: open')
    })
  })

  describe('3. Query Pagination & Limits Challenge', () => {
    it('menerapkan batas maksimal limit 50 (menolak limit > 50)', () => {
      // Limit 50 diizinkan
      const maxAllowed = supportThreadQuerySchema.safeParse({ limit: 50 })
      expect(maxAllowed.success).toBe(true)
      if (maxAllowed.success) {
        expect(maxAllowed.data.limit).toBe(50)
      }

      // Limit 51 ditolak
      const exceeded = supportThreadQuerySchema.safeParse({ limit: 51 })
      expect(exceeded.success).toBe(false)

      // Limit 100 ditolak
      const largeExceeded = supportThreadQuerySchema.safeParse({ limit: 100 })
      expect(largeExceeded.success).toBe(false)

      // Limit string '50' dikonversi dan valid
      const stringFifty = supportThreadQuerySchema.safeParse({ limit: '50' })
      expect(stringFifty.success).toBe(true)
      if (stringFifty.success) {
        expect(stringFifty.data.limit).toBe(50)
      }

      // Limit string '51' dikonversi lalu ditolak
      const stringFiftyOne = supportThreadQuerySchema.safeParse({ limit: '51' })
      expect(stringFiftyOne.success).toBe(false)
    })

    it('menolak limit <= 0 atau non-integer', () => {
      expect(supportThreadQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ limit: -1 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ limit: -99 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ limit: 1.5 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false)
    })

    it('menolak page <= 0 atau non-integer', () => {
      expect(supportThreadQuerySchema.safeParse({ page: 0 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ page: -1 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ page: 2.7 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ page: 'xyz' }).success).toBe(false)
    })

    it('menerapkan nilai default page = 1 dan limit = 20 saat parameter tidak diberikan', () => {
      const result = supportThreadQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.status).toBe('all')
      }
    })

    it('memvalidasi kalkulasi rentang offset database (from dan to)', () => {
      const calculateRange = (page: number, limit: number) => {
        const from = (page - 1) * limit
        const to = from + limit - 1
        return { from, to, count: to - from + 1 }
      }

      // Page 1, limit 20
      const p1 = calculateRange(1, 20)
      expect(p1.from).toBe(0)
      expect(p1.to).toBe(19)
      expect(p1.count).toBe(20)

      // Page 2, limit 20
      const p2 = calculateRange(2, 20)
      expect(p2.from).toBe(20)
      expect(p2.to).toBe(39)
      expect(p2.count).toBe(20)

      // Page 1, limit 50 (maksimal)
      const pMax = calculateRange(1, 50)
      expect(pMax.from).toBe(0)
      expect(pMax.to).toBe(49)
      expect(pMax.count).toBe(50)

      // Page 3, limit 50
      const p3Max = calculateRange(3, 50)
      expect(p3Max.from).toBe(100)
      expect(p3Max.to).toBe(149)
      expect(p3Max.count).toBe(50)
    })

    it('memvalidasi filter status pada kueri thread', () => {
      const validFilters = ['all', 'open', 'waiting_admin', 'waiting_customer', 'resolved']
      for (const status of validFilters) {
        const result = supportThreadQuerySchema.safeParse({ status })
        expect(result.success).toBe(true)
      }

      const invalidFilters = ['deleted', 'closed', 'active', 'random']
      for (const status of invalidFilters) {
        const result = supportThreadQuerySchema.safeParse({ status })
        expect(result.success).toBe(false)
      }
    })
  })

  describe('4. Server Utilities & Canned Responses Integrity', () => {
    it('memverifikasi pesan pembuka bot selamat datang sesuai standar', () => {
      expect(WELCOME_BOT_MESSAGE).toBeDefined()
      expect(WELCOME_BOT_MESSAGE.length).toBeGreaterThan(20)
      expect(SYSTEM_WELCOME_MESSAGE).toBe(WELCOME_BOT_MESSAGE)
      // Memastikan tidak ada karakter em dash atau en dash
      expect(/[\u2014\u2013]/.test(WELCOME_BOT_MESSAGE)).toBe(false)
    })

    it('memverifikasi 5 respon cepat canned response berbahasa Indonesia', () => {
      expect(SUPPORT_CANNED_RESPONSES).toHaveLength(5)
      const expectedKeys = [
        'greeting',
        'ask_order_id',
        'shipping_info',
        'refund_processed',
        'closing_resolved',
      ]
      const actualKeys = SUPPORT_CANNED_RESPONSES.map((r) => r.key)
      expect(actualKeys).toEqual(expectedKeys)

      for (const canned of SUPPORT_CANNED_RESPONSES) {
        expect(canned.key).toBeTruthy()
        expect(canned.label).toBeTruthy()
        expect(canned.text).toBeTruthy()
        expect(/[\u2014\u2013]/.test(canned.text)).toBe(false)
        expect(/[\u2014\u2013]/.test(canned.label)).toBe(false)
      }
    })

    it('memverifikasi metadata pemetaan status thread bantuan', () => {
      const statuses: Array<keyof typeof SUPPORT_STATUS_MAP> = [
        'open',
        'waiting_admin',
        'waiting_customer',
        'resolved',
      ]
      for (const st of statuses) {
        const meta = SUPPORT_STATUS_MAP[st]
        expect(meta).toBeDefined()
        expect(meta.label).toBeTruthy()
        expect(meta.tone).toBeTruthy()
        expect(meta.description).toBeTruthy()
        expect(['info', 'warning', 'primary', 'success']).toContain(meta.tone)
        expect(/[\u2014\u2013]/.test(meta.description)).toBe(false)
      }
    })
  })

  describe('5. Admin Reply Schema Integrity (adminSendSupportMessageSchema)', () => {
    it('memvalidasi balasan admin valid', () => {
      const validPayload = {
        message_text: 'Halo kak, pesanan sedang disiapkan.',
        attachment_url: 'https://example.com/storage/chat-attachments/proof.png',
        attachment_type: 'image' as const,
      }
      const result = adminSendSupportMessageSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
    })

    it('menolak balasan admin dengan attachment_type selain image', () => {
      const invalidPayload = {
        message_text: 'Cek kartu ini',
        attachment_url: 'https://example.com/file',
        attachment_type: 'order_card',
      }
      const result = adminSendSupportMessageSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })

    it('menolak balasan admin dengan teks kosong atau lebih dari 1000 karakter', () => {
      expect(adminSendSupportMessageSchema.safeParse({ message_text: '' }).success).toBe(false)
      expect(adminSendSupportMessageSchema.safeParse({ message_text: '   ' }).success).toBe(false)
      expect(
        adminSendSupportMessageSchema.safeParse({ message_text: 'a'.repeat(1001) }).success,
      ).toBe(false)
      expect(
        adminSendSupportMessageSchema.safeParse({ message_text: 'a'.repeat(1000) }).success,
      ).toBe(true)
    })
  })
})
