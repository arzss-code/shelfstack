import { describe, it, expect } from 'vitest'
import {
  createReturnRequestSchema,
  updateReturnTrackingSchema,
  adminReviewReturnRequestSchema,
  returnReasonTypeSchema,
  returnSolutionTypeSchema,
  returnRequestStatusSchema,
} from '../../shared/schemas/return-request'
import {
  checkReturnWindowEligibility,
  RETURN_REASON_LABELS,
  RETURN_SOLUTION_LABELS,
  RETURN_STATUS_MAP,
} from '../../server/utils/return-request'

describe('Return Request Schema Validation & Eligibility', () => {
  describe('createReturnRequestSchema', () => {
    it('berhasil memvalidasi payload retur lengkap yang valid', () => {
      const validPayload = {
        reason_type: 'defective',
        solution_type: 'refund',
        customer_notes: 'Layar perangkat berkedip dan mati total saat dinyalakan pertama kali.',
        proof_image_urls: ['https://example.com/proof1.jpg'],
        unboxing_video_url: 'https://drive.google.com/file/d/12345/view',
      }

      const result = createReturnRequestSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.reason_type).toBe('defective')
        expect(result.data.solution_type).toBe('refund')
      }
    })

    it('gagal jika deskripsi kendala kurang dari 20 karakter', () => {
      const invalidPayload = {
        reason_type: 'wrong_item',
        solution_type: 'replacement',
        customer_notes: 'Barang salah', // hanya 12 karakter
        proof_image_urls: ['https://example.com/proof.jpg'],
      }

      const result = createReturnRequestSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('minimal 20 karakter')
      }
    })

    it('gagal jika tidak melampirkan foto bukti sama sekali', () => {
      const invalidPayload = {
        reason_type: 'damaged_in_transit',
        solution_type: 'replacement',
        customer_notes: 'Boks penyok parah dan tombol volume terlepas dari bodi unit.',
        proof_image_urls: [],
      }

      const result = createReturnRequestSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Unggah minimal 1 foto')
      }
    })

    it('gagal jika melampirkan foto bukti lebih dari 3 lembar', () => {
      const invalidPayload = {
        reason_type: 'missing_accessories',
        solution_type: 'replacement',
        customer_notes: 'Kabel charger dan adaptor tidak ada dalam boks kemasan resmi.',
        proof_image_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
        ],
      }

      const result = createReturnRequestSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Maksimal 3 foto')
      }
    })

    it('menolak pilihan alasan atau solusi yang tidak dikenal', () => {
      const invalidReason = returnReasonTypeSchema.safeParse('bored_with_product')
      expect(invalidReason.success).toBe(false)

      const invalidSolution = returnSolutionTypeSchema.safeParse('free_gift')
      expect(invalidSolution.success).toBe(false)
    })
  })

  describe('updateReturnTrackingSchema', () => {
    it('menerima kurir dan nomor resi yang valid', () => {
      const valid = {
        return_courier: 'JNE Express',
        return_tracking_number: 'JNE1234567890',
      }
      const result = updateReturnTrackingSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('menolak nomor resi dengan panjang kurang dari 5 karakter atau karakter ilegal', () => {
      const tooShort = {
        return_courier: 'JNE',
        return_tracking_number: '123',
      }
      expect(updateReturnTrackingSchema.safeParse(tooShort).success).toBe(false)

      const invalidChars = {
        return_courier: 'JNE',
        return_tracking_number: 'RESI@#$*!',
      }
      expect(updateReturnTrackingSchema.safeParse(invalidChars).success).toBe(false)
    })
  })

  describe('adminReviewReturnRequestSchema', () => {
    it('memvalidasi keputusan admin dengan opsi restock default true', () => {
      const review = {
        status: 'completed',
        admin_notes: 'Unit telah diverifikasi dan dana telah dikembalikan via payment gateway.',
        restock_inventory: true,
      }
      const result = adminReviewReturnRequestSchema.safeParse(review)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('completed')
        expect(result.data.restock_inventory).toBe(true)
      }
    })

    it('menolak status keputusan ilegal', () => {
      const result = adminReviewReturnRequestSchema.safeParse({
        status: 'unknown_status',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('checkReturnWindowEligibility Helper', () => {
    it('menolak pesanan yang belum berstatus completed', () => {
      const result = checkReturnWindowEligibility({
        status: 'shipped',
        completed_at: null,
      })
      expect(result.isEligible).toBe(false)
      expect(result.reason).toContain('hanya dapat diproses untuk pesanan yang telah selesai')
    })

    it('mengizinkan pesanan completed yang masih dalam jendela 7 hari', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const result = checkReturnWindowEligibility({
        status: 'completed',
        completed_at: threeDaysAgo,
      })
      expect(result.isEligible).toBe(true)
      expect(result.remainingDays).toBe(4)
    })

    it('menolak pesanan completed yang telah melebihi jendela 7 hari', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      const result = checkReturnWindowEligibility({
        status: 'completed',
        completed_at: eightDaysAgo,
      })
      expect(result.isEligible).toBe(false)
      expect(result.reason).toContain('Jendela jaminan retur 7 hari')
    })
  })

  describe('Labels and Metadata Dictionaries', () => {
    it('memiliki label Bahasa Indonesia resmi untuk seluruh alasan retur', () => {
      expect(RETURN_REASON_LABELS.defective).toBe('Cacat Pabrik / Kendala Fungsi')
      expect(RETURN_REASON_LABELS.damaged_in_transit).toBe('Barang Rusak Saat Pengiriman')
      expect(RETURN_REASON_LABELS.wrong_item).toBe('Produk Tidak Sesuai / Salah Kirim')
    })

    it('memiliki metadata langkah alur untuk seluruh status retur', () => {
      expect(RETURN_STATUS_MAP.requested.step).toBe(1)
      expect(RETURN_STATUS_MAP.approved.step).toBe(2)
      expect(RETURN_STATUS_MAP.item_received.step).toBe(3)
      expect(RETURN_STATUS_MAP.completed.step).toBe(4)
      expect(RETURN_STATUS_MAP.rejected.tone).toBe('danger')
    })
  })
})
