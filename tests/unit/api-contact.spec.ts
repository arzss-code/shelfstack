import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactMessageSchema } from '../../shared/schemas/contact'
import contactHandler from '../../server/api/contact.post'

describe('Contact Form Zod Schema & API Handler Suite', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'readBody',
      vi.fn((event: { _body?: unknown }) => Promise.resolve(event._body || {})),
    )
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('memvalidasi payload kontak lengkap yang valid', () => {
    const validData = {
      name: 'Arya Danu',
      email: 'arya@example.com',
      category: 'Pertanyaan Produk',
      orderNumber: 'ORD-20261117-001',
      message: 'Saya ingin menanyakan ketersediaan stok untuk produk ShelfStack Billet.',
    }
    const result = contactMessageSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Arya Danu')
      expect(result.data.email).toBe('arya@example.com')
      expect(result.data.category).toBe('Pertanyaan Produk')
      expect(result.data.orderNumber).toBe('ORD-20261117-001')
    }
  })

  it('mengizinkan orderNumber opsional bernilai kosong atau null', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Budi Santoso',
      email: 'budi@example.com',
      category: 'Konsultasi Layanan',
      message: 'Apakah ada showroom offline yang dapat dikunjungi di Semarang?',
    })
    expect(result.success).toBe(true)
  })

  it('menolak nama lengkap yang kurang dari 3 karakter', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Jo',
      email: 'jo@example.com',
      category: 'Umum',
      message: 'Halo, saya ingin bertanya tentang ShelfStack.',
    })
    expect(result.success).toBe(false)
  })

  it('menolak format email yang tidak valid', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Jane Doe',
      email: 'bukan-email-valid',
      category: 'Umum',
      message: 'Halo, ini pesan percobaan dengan email salah.',
    })
    expect(result.success).toBe(false)
  })

  it('menolak pesan yang kurang dari 10 karakter', () => {
    const result = contactMessageSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      category: 'Umum',
      message: 'Pendek',
    })
    expect(result.success).toBe(false)
  })

  it('handler API mengembalikan 400 ketika payload tidak valid', async () => {
    const mockEvent = {
      node: { req: {}, res: {} },
      context: {},
      _body: { name: 'A' },
    } as any

    await expect(contactHandler(mockEvent)).rejects.toThrow()
  })

  it('handler API berhasil menerima pesan dan mengembalikan tiket konfirmasi', async () => {
    const mockEvent = {
      node: { req: {}, res: {} },
      context: {},
      _body: {
        name: 'Citra Kirana',
        email: 'citra@example.com',
        category: 'Pengiriman & Logistik',
        message: 'Mohon bantuan cek estimasi kedatangan kurir ke Jawa Tengah.',
      },
    } as any

    const res = await contactHandler(mockEvent)
    expect(res.status).toBe('success')
    expect(res.data.ticket_id).toBeDefined()
    expect(res.data.ticket_id.startsWith('CTK-')).toBe(true)
  })
})
