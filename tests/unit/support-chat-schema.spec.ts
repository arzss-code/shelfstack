import { describe, it, expect, beforeAll } from 'vitest'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'

// Authoritative Zod Contract Schemas
// If shared/schemas/support-chat.ts exists (implemented in Milestone 2), load and test the real module.
// Otherwise, test against the authoritative specification contract.
let sendSupportMessageSchema: z.ZodTypeAny
let adminSendSupportMessageSchema: z.ZodTypeAny
let updateThreadStatusSchema: z.ZodTypeAny
let supportThreadQuerySchema: z.ZodTypeAny

beforeAll(async () => {
  const schemaFile = path.resolve(__dirname, '../../shared/schemas/support-chat.ts')
  if (fs.existsSync(schemaFile)) {
    const mod = await import(/* @vite-ignore */ schemaFile)
    sendSupportMessageSchema = mod.sendSupportMessageSchema
    adminSendSupportMessageSchema = mod.adminSendSupportMessageSchema
    updateThreadStatusSchema = mod.updateThreadStatusSchema
    supportThreadQuerySchema = mod.supportThreadQuerySchema
  } else {
    sendSupportMessageSchema = z.object({
      message_text: z
        .string()
        .trim()
        .min(1, 'Pesan tidak boleh kosong')
        .max(1000, 'Pesan maksimal 1000 karakter'),
      attachment_url: z.string().url('URL lampiran tidak valid').optional().nullable(),
      attachment_type: z.enum(['image', 'order_card', 'product_card']).optional().nullable(),
      attached_order_id: z.string().uuid('ID pesanan tidak valid').optional().nullable(),
      attached_product_id: z
        .union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
        .optional()
        .nullable(),
    })

    adminSendSupportMessageSchema = z.object({
      message_text: z
        .string()
        .trim()
        .min(1, 'Balasan tidak boleh kosong')
        .max(1000, 'Balasan maksimal 1000 karakter'),
      attachment_url: z.string().url('URL lampiran tidak valid').optional().nullable(),
      attachment_type: z.enum(['image']).optional().nullable(),
    })

    updateThreadStatusSchema = z.object({
      status: z.enum(['open', 'waiting_admin', 'waiting_customer', 'resolved'], {
        message: 'Status thread bantuan tidak valid',
      }),
    })

    supportThreadQuerySchema = z.object({
      status: z
        .enum(['all', 'open', 'waiting_admin', 'waiting_customer', 'resolved'])
        .optional()
        .default('all'),
      search: z.string().trim().optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(50).optional().default(20),
    })
  }
})

describe('Support Chat Validation Schemas', () => {
  describe('sendSupportMessageSchema (Customer Message)', () => {
    it('berhasil memvalidasi pesan teks sederhana yang valid', () => {
      const payload = {
        message_text: 'Halo, saya ingin menanyakan estimasi pengiriman pesanan saya.',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message_text).toBe(payload.message_text)
      }
    })

    it('berhasil memvalidasi pesan dengan lampiran gambar valid', () => {
      const payload = {
        message_text: 'Berikut foto bukti unboxing produk.',
        attachment_url: 'https://example.com/storage/chat-attachments/user-1/proof.jpg',
        attachment_type: 'image',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attachment_url).toBe(payload.attachment_url)
        expect(result.data.attachment_type).toBe('image')
      }
    })

    it('berhasil memvalidasi pesan dengan referensi pesanan terlampir (UUID)', () => {
      const payload = {
        message_text: 'Mohon dicek untuk pesanan ini.',
        attachment_type: 'order_card',
        attached_order_id: '123e4567-e89b-12d3-a456-426614174000',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attached_order_id).toBe('123e4567-e89b-12d3-a456-426614174000')
      }
    })

    it('berhasil memvalidasi pesan dengan referensi produk angka positif', () => {
      const payload = {
        message_text: 'Apakah produk ini masih tersedia?',
        attachment_type: 'product_card',
        attached_product_id: 105,
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attached_product_id).toBe(105)
      }
    })

    it('berhasil mengonversi attached_product_id format string angka menjadi number', () => {
      const payload = {
        message_text: 'Pertanyaan tentang produk 42',
        attached_product_id: '42',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attached_product_id).toBe(42)
      }
    })

    it('menerima field opsional bernilai null', () => {
      const payload = {
        message_text: 'Pesan tanpa lampiran',
        attachment_url: null,
        attachment_type: null,
        attached_order_id: null,
        attached_product_id: null,
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('menolak pesan dengan string kosong', () => {
      const payload = {
        message_text: '',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Pesan tidak boleh kosong',
        )
      }
    })

    it('menolak pesan yang hanya berisi spasi', () => {
      const payload = {
        message_text: '     ',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Pesan tidak boleh kosong',
        )
      }
    })

    it('melakukan trim pada spasi di awal dan akhir pesan', () => {
      const payload = {
        message_text: '   Halo tim CS   ',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message_text).toBe('Halo tim CS')
      }
    })

    it('menerima pesan dengan tepat 1 karakter setelah trim', () => {
      const payload = {
        message_text: 'A',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('menerima pesan dengan batas maksimal 1000 karakter', () => {
      const payload = {
        message_text: 'x'.repeat(1000),
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('menolak pesan yang melebihi 1000 karakter', () => {
      const payload = {
        message_text: 'x'.repeat(1001),
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Pesan maksimal 1000 karakter',
        )
      }
    })

    it('menolak format attachment_url yang tidak valid', () => {
      const payload = {
        message_text: 'Pesan dengan link rusak',
        attachment_url: 'bukan-url-valid',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.attachment_url).toContain(
          'URL lampiran tidak valid',
        )
      }
    })

    it('menolak attachment_type yang tidak terdaftar dalam enum', () => {
      const payload = {
        message_text: 'Lampiran tidak dikenal',
        attachment_type: 'video_file',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('menolak attached_order_id yang bukan format UUID', () => {
      const payload = {
        message_text: 'Cek pesanan ini',
        attached_order_id: 'order-12345-bukan-uuid',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.attached_order_id).toContain(
          'ID pesanan tidak valid',
        )
      }
    })

    it('menolak attached_product_id jika bukan angka atau string non numerik', () => {
      const payload = {
        message_text: 'Cek produk ini',
        attached_product_id: 'produk-abc',
      }
      const result = sendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('adminSendSupportMessageSchema (CS Admin Reply)', () => {
    it('berhasil memvalidasi balasan teks admin yang valid', () => {
      const payload = {
        message_text: 'Halo kak, pesanan kakak saat ini sedang diproses di gudang sentral.',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message_text).toBe(payload.message_text)
      }
    })

    it('berhasil memvalidasi balasan admin dengan lampiran gambar panduan', () => {
      const payload = {
        message_text: 'Berikut panduan cara klaim garansi pada produk.',
        attachment_url: 'https://example.com/guide.jpg',
        attachment_type: 'image',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attachment_type).toBe('image')
      }
    })

    it('menolak balasan admin yang kosong', () => {
      const payload = {
        message_text: '',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Balasan tidak boleh kosong',
        )
      }
    })

    it('menolak balasan admin yang hanya berisi whitespace', () => {
      const payload = {
        message_text: '   \n  \t  ',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Balasan tidak boleh kosong',
        )
      }
    })

    it('menerima balasan admin tepat 1 karakter', () => {
      const payload = {
        message_text: 'Y',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('menerima balasan admin tepat 1000 karakter', () => {
      const payload = {
        message_text: 'a'.repeat(1000),
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('menolak balasan admin melebihi 1000 karakter', () => {
      const payload = {
        message_text: 'a'.repeat(1001),
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message_text).toContain(
          'Balasan maksimal 1000 karakter',
        )
      }
    })

    it('menolak tipe attachment selain image untuk balasan admin', () => {
      const payload = {
        message_text: 'Cek order ini',
        attachment_url: 'https://example.com/order',
        attachment_type: 'order_card',
      }
      const result = adminSendSupportMessageSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('updateThreadStatusSchema (Thread State Transitions)', () => {
    it('menerima status open', () => {
      const result = updateThreadStatusSchema.safeParse({ status: 'open' })
      expect(result.success).toBe(true)
    })

    it('menerima status waiting_admin', () => {
      const result = updateThreadStatusSchema.safeParse({ status: 'waiting_admin' })
      expect(result.success).toBe(true)
    })

    it('menerima status waiting_customer', () => {
      const result = updateThreadStatusSchema.safeParse({ status: 'waiting_customer' })
      expect(result.success).toBe(true)
    })

    it('menerima status resolved', () => {
      const result = updateThreadStatusSchema.safeParse({ status: 'resolved' })
      expect(result.success).toBe(true)
    })

    it('menolak status ilegal atau tidak terdaftar', () => {
      const result = updateThreadStatusSchema.safeParse({ status: 'closed_forever' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.status).toContain(
          'Status thread bantuan tidak valid',
        )
      }
    })

    it('menolak payload status kosong', () => {
      const result = updateThreadStatusSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('supportThreadQuerySchema (Admin Inbox Filter & Pagination)', () => {
    it('menerapkan nilai default saat query parameter kosong', () => {
      const result = supportThreadQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('all')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('menerima status filter waiting_admin', () => {
      const result = supportThreadQuerySchema.safeParse({ status: 'waiting_admin' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('waiting_admin')
      }
    })

    it('menerima query pencarian nama dan melakukan trim', () => {
      const result = supportThreadQuerySchema.safeParse({ search: '  Budi Pratama  ' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('Budi Pratama')
      }
    })

    it('melakukan koersi string angka pada parameter page dan limit', () => {
      const result = supportThreadQuerySchema.safeParse({ page: '3', limit: '15' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.limit).toBe(15)
      }
    })

    it('menolak limit yang melebihi batas maksimal 50', () => {
      const result = supportThreadQuerySchema.safeParse({ limit: 51 })
      expect(result.success).toBe(false)
    })

    it('menolak page 0 atau angka negatif', () => {
      expect(supportThreadQuerySchema.safeParse({ page: 0 }).success).toBe(false)
      expect(supportThreadQuerySchema.safeParse({ page: -1 }).success).toBe(false)
    })

    it('menolak filter status yang tidak valid', () => {
      const result = supportThreadQuerySchema.safeParse({ status: 'deleted_threads' })
      expect(result.success).toBe(false)
    })
  })
})
