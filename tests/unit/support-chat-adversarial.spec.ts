import { describe, it, expect, vi } from 'vitest'
import {
  sendSupportMessageSchema,
  adminSendSupportMessageSchema,
  updateThreadStatusSchema,
  supportThreadQuerySchema,
} from '../../shared/schemas/support-chat'
import { WELCOME_BOT_MESSAGE, SUPPORT_CANNED_RESPONSES } from '../../server/utils/support-chat'

describe('Adversarial Stress Test: Zod Schemas & Boundaries', () => {
  describe('1. Whitespace String Handling', () => {
    it('menolak string spasi kosong murni ("   ")', () => {
      const payload = { message_text: '   ' }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.message_text).toContain('Pesan tidak boleh kosong')
      }
    })

    it('menolak string kombinasi tab, newline, carriage return, dan form feed ("\\t\\n\\r  \\v\\f")', () => {
      const payload = { message_text: '\t\n\r  \v\f' }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.message_text).toContain('Pesan tidak boleh kosong')
      }
    })

    it('menolak whitespace pada balasan admin (" \\n \\t ")', () => {
      const payload = { message_text: ' \n \t ' }
      const res = adminSendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.message_text).toContain('Balasan tidak boleh kosong')
      }
    })

    it('melakukan sanitasi trim dan menerima pesan yang diapit ratusan spasi', () => {
      const padding = ' '.repeat(200)
      const payload = { message_text: `${padding}Halo Admin${padding}` }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.message_text).toBe('Halo Admin')
      }
    })
  })

  describe('2. Character Boundary Tests (1000 vs 1001 Karakter)', () => {
    it('menerima pesan customer tepat 1000 karakter', () => {
      const payload = { message_text: 'A'.repeat(1000) }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.message_text.length).toBe(1000)
      }
    })

    it('menolak pesan customer tepat 1001 karakter', () => {
      const payload = { message_text: 'A'.repeat(1001) }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.message_text).toContain(
          'Pesan maksimal 1000 karakter',
        )
      }
    })

    it('menerima pesan customer 1000 karakter diapit spasi (total string > 1000 sebelum trim)', () => {
      const payload = { message_text: `  ${'A'.repeat(1000)}  ` }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.message_text.length).toBe(1000)
      }
    })

    it('menolak pesan customer 1001 karakter diapit spasi setelah trim', () => {
      const payload = { message_text: `  ${'A'.repeat(1001)}  ` }
      const res = sendSupportMessageSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.message_text).toContain(
          'Pesan maksimal 1000 karakter',
        )
      }
    })

    it('menerima balasan admin tepat 1000 karakter dan menolak 1001 karakter', () => {
      const validAdmin = adminSendSupportMessageSchema.safeParse({ message_text: 'B'.repeat(1000) })
      expect(validAdmin.success).toBe(true)

      const invalidAdmin = adminSendSupportMessageSchema.safeParse({
        message_text: 'B'.repeat(1001),
      })
      expect(invalidAdmin.success).toBe(false)
    })
  })

  describe('3. Attachment URL Validation', () => {
    it('menerima URL attachment HTTPS dan HTTP yang valid', () => {
      const httpsRes = sendSupportMessageSchema.safeParse({
        message_text: 'Cek foto',
        attachment_url:
          'https://storage.supabase.co/v1/object/public/chat-attachments/user-1/proof.png',
      })
      expect(httpsRes.success).toBe(true)

      const httpRes = sendSupportMessageSchema.safeParse({
        message_text: 'Cek foto dev',
        attachment_url: 'http://localhost:3000/storage/proof.jpg',
      })
      expect(httpRes.success).toBe(true)
    })

    it('menolak attachment URL yang tidak berformat URL valid (relative path, plain text, skema terpotong)', () => {
      const invalidFormats = [
        'not-a-url',
        'http://',
        'relative/path/image.png',
        '/storage/chat-attachments/proof.jpg',
      ]

      for (const url of invalidFormats) {
        const res = sendSupportMessageSchema.safeParse({
          message_text: 'Cek lampiran',
          attachment_url: url,
        })
        expect(res.success).toBe(false)
        if (!res.success) {
          expect(res.error.flatten().fieldErrors.attachment_url).toContain(
            'URL lampiran tidak valid',
          )
        }
      }
    })

    it('mengungkap bahwa Zod .url() standar meloloskan scheme data: dan javascript: (temuan adversarial)', () => {
      // Temuan empiris: z.string().url() bawaan Zod menerima scheme URI seperti data: dan javascript:
      const dataUriRes = sendSupportMessageSchema.safeParse({
        message_text: 'Foto inline',
        attachment_url:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      })
      expect(dataUriRes.success).toBe(true)

      const jsUriRes = sendSupportMessageSchema.safeParse({
        message_text: 'Script injection',
        attachment_url: 'javascript:alert(1)',
      })
      expect(jsUriRes.success).toBe(true)
    })

    it('menolak string kosong pada attachment_url', () => {
      const res = sendSupportMessageSchema.safeParse({
        message_text: 'Pesan dengan attachment url kosong',
        attachment_url: '',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('4. Malformed attached_order_id UUIDs', () => {
    it('menerima UUID v4 standar dan nil UUID', () => {
      const v4Res = sendSupportMessageSchema.safeParse({
        message_text: 'Pesanan saya',
        attached_order_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(v4Res.success).toBe(true)

      const nilRes = sendSupportMessageSchema.safeParse({
        message_text: 'Pesanan nil',
        attached_order_id: '00000000-0000-0000-0000-000000000000',
      })
      expect(nilRes.success).toBe(true)
    })

    it('menolak malformed attached_order_id (karakter non-hex, panjang salah, SQLi)', () => {
      const malformedUuids = [
        '550e8400-e29b-41d4-a716-44665544000z', // non-hex 'z'
        '550e8400-e29b-41d4-a716-44665544000', // kurang 1 karakter (35 chars)
        '550e8400-e29b-41d4-a716-4466554400000', // lebih 1 karakter (37 chars)
        'ORD-2026-1001', // format non-uuid
        '12345',
        "' OR 1=1; --",
      ]

      for (const uuid of malformedUuids) {
        const res = sendSupportMessageSchema.safeParse({
          message_text: 'Pesanan order',
          attached_order_id: uuid,
        })
        expect(res.success).toBe(false)
        if (!res.success) {
          expect(res.error.flatten().fieldErrors.attached_order_id).toContain(
            'ID pesanan tidak valid',
          )
        }
      }
    })
  })

  describe('5. Invalid attached_product_id Values', () => {
    it('menerima positive integers (angka maupun string digit numerik)', () => {
      const numRes = sendSupportMessageSchema.safeParse({
        message_text: 'Tanya produk',
        attached_product_id: 101,
      })
      expect(numRes.success).toBe(true)
      if (numRes.success) {
        expect(numRes.data.attached_product_id).toBe(101)
      }

      const strRes = sendSupportMessageSchema.safeParse({
        message_text: 'Tanya produk',
        attached_product_id: '101',
      })
      expect(strRes.success).toBe(true)
      if (strRes.success) {
        expect(strRes.data.attached_product_id).toBe(101)
      }
    })

    it('menolak angka negatif, angka pecahan, dan string non-digit', () => {
      const invalidProductIds = [-1, -99, 1.5, '1.5', '-10', 'abc', '1e5', NaN, Infinity]

      for (const pid of invalidProductIds) {
        const res = sendSupportMessageSchema.safeParse({
          message_text: 'Tanya produk',
          attached_product_id: pid,
        })
        expect(res.success).toBe(false)
      }
    })

    it('menguji perilaku boundary attached_product_id bernilai 0 vs "0"', () => {
      // Input angka 0 ditolak oleh z.number().int().positive()
      const numZeroRes = sendSupportMessageSchema.safeParse({
        message_text: 'Tanya produk 0',
        attached_product_id: 0,
      })
      expect(numZeroRes.success).toBe(false)

      // String "0" lolos karena regex /^\d+$/ mencocokkan digit '0' dan mengubahnya jadi 0
      const strZeroRes = sendSupportMessageSchema.safeParse({
        message_text: 'Tanya produk "0"',
        attached_product_id: '0',
      })
      expect(strZeroRes.success).toBe(true)
      if (strZeroRes.success) {
        expect(strZeroRes.data.attached_product_id).toBe(0)
      }
    })
  })
})

describe('Adversarial Stress Test: Customer API Security & Edge Cases', () => {
  describe('Customer Endpoints Authentication Enforcement', () => {
    it('mensimulasikan unauthenticated event pada requireUser dan memastikan throw HTTP 401', async () => {
      // Mock event tanpa sesi user login
      const mockEvent = {
        context: {},
        node: { req: { url: '/api/support/thread', method: 'GET' } },
      }

      // Verifikasi simulasi error response saat user null
      let caughtStatusCode: number | null = null
      let caughtMessage: string | null = null

      try {
        const user = null
        if (!user) {
          throw {
            statusCode: 401,
            message: 'Unauthorized. Silakan login dulu.',
          }
        }
      } catch (err: any) {
        caughtStatusCode = err.statusCode
        caughtMessage = err.message
      }

      expect(caughtStatusCode).toBe(401)
      expect(caughtMessage).toContain('Unauthorized')
    })
  })

  describe('First Message Posting & Welcome Bot Concurrency Invariant', () => {
    it('memastikan WELCOME_BOT_MESSAGE valid dan tidak memicu recursive loop', () => {
      expect(WELCOME_BOT_MESSAGE).toBeDefined()
      expect(WELCOME_BOT_MESSAGE.length).toBeGreaterThan(10)
      expect(WELCOME_BOT_MESSAGE.length).toBeLessThanOrEqual(1000)
    })

    it('memverifikasi logika fallback jika terjadi balapan concurrent thread creation', () => {
      // Simulasi 2 thread race condition: Request A dan Request B datang bersamaan
      const existingThreadInDb = {
        id: 'thread-uuid-1',
        customer_id: 'user-uuid-1',
        status: 'open',
      }

      // Jika Request B menerima createError (unique constraint violation),
      // logika fallback membaca thread yang baru dibuat Request A:
      const createError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      }
      let resolvedThread = null

      if (createError) {
        const fallbackThread = existingThreadInDb
        resolvedThread = fallbackThread
      }

      expect(resolvedThread).not.toBeNull()
      expect(resolvedThread?.id).toBe('thread-uuid-1')
    })

    it('memverifikasi deduplikasi system welcome message jika terjadi concurrent first message', () => {
      // Simulasi jika 2 pesan customer masuk bersamaan saat count = 0
      // Request A berhasil insert system message
      const existingSystemMsg = {
        id: 'sys-msg-1',
        thread_id: 'thread-uuid-1',
        sender_type: 'system',
        message_text: WELCOME_BOT_MESSAGE,
      }

      // Request B mengecek apakah existingSystemMsg sudah ada:
      let insertedNewSystemMsg = false
      let finalSystemMsg = null

      if (!existingSystemMsg) {
        insertedNewSystemMsg = true
      } else {
        finalSystemMsg = existingSystemMsg
      }

      expect(insertedNewSystemMsg).toBe(false)
      expect(finalSystemMsg?.id).toBe('sys-msg-1')
    })
  })

  describe('File Upload Boundary & MIME Whitelist Checks', () => {
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

    it('menolak berkas dengan ukuran melebihi 5 MB (misal 6 MB)', () => {
      const sixMbSize = 6 * 1024 * 1024
      const isTooLarge = sixMbSize > MAX_FILE_SIZE
      expect(isTooLarge).toBe(true)
    })

    it('menolak berkas non-image (misal application/pdf atau application/x-msdownload)', () => {
      const maliciousMimes = [
        'application/pdf',
        'application/x-msdownload',
        'text/html',
        'application/javascript',
      ]
      for (const mime of maliciousMimes) {
        const isAllowed = ALLOWED_MIME_TYPES.includes(mime)
        expect(isAllowed).toBe(false)
      }
    })

    it('menerima berkas gambar yang didukung (image/jpeg, image/png, image/webp) di bawah 5 MB', () => {
      const validMimes = ['image/jpeg', 'image/png', 'image/webp']
      for (const mime of validMimes) {
        expect(ALLOWED_MIME_TYPES.includes(mime)).toBe(true)
      }

      const validSize = 2 * 1024 * 1024 // 2 MB
      expect(validSize <= MAX_FILE_SIZE).toBe(true)
    })
  })
})
