import { describe, expect, it } from 'vitest'
import {
  calculateShippingFee,
  shippingRateTiers,
  type ShippingService,
} from '../../shared/schemas/shipping'
import { checkoutSchema } from '../../shared/schemas/order'
import calculateHandler, {
  calculateShippingInputSchema,
  processShippingCalculation,
} from '../../server/api/shipping/calculate.post'

describe('Shipping Calculator & Tiered Rates Unit Tests', () => {
  describe('calculateShippingFee - Tiered Rates', () => {
    it('menghitung tarif reguler standar jika subtotal di bawah 500k', () => {
      const result = calculateShippingFee('reguler', 25000000)
      expect(result.service).toBe('reguler')
      expect(result.feeCents).toBe(1500000) // Rp 15.000
      expect(result.isFree).toBe(false)
    })

    it('menghitung tarif express / kilat (Rp 30.000)', () => {
      const result = calculateShippingFee('express', 25000000)
      expect(result.service).toBe('express')
      expect(result.feeCents).toBe(3000000) // Rp 30.000
      expect(result.isFree).toBe(false)
    })

    it('menghitung tarif instant / sameday (Rp 45.000)', () => {
      const result = calculateShippingFee('instant', 25000000)
      expect(result.service).toBe('instant')
      expect(result.feeCents).toBe(4500000) // Rp 45.000
      expect(result.isFree).toBe(false)
    })

    it('menghitung tarif cargo ekonomis (Rp 25.000)', () => {
      const result = calculateShippingFee('cargo', 25000000)
      expect(result.service).toBe('cargo')
      expect(result.feeCents).toBe(2500000) // Rp 25.000
      expect(result.isFree).toBe(false)
    })

    it('melakukan fallback ke reguler untuk input service null, undefined, atau string tidak valid', () => {
      const resNull = calculateShippingFee(null, 10000000)
      expect(resNull.service).toBe('reguler')
      expect(resNull.feeCents).toBe(1500000)

      const resUndefined = calculateShippingFee(undefined, 10000000)
      expect(resUndefined.service).toBe('reguler')
      expect(resUndefined.feeCents).toBe(1500000)

      const resInvalid = calculateShippingFee('drone_delivery', 10000000)
      expect(resInvalid.service).toBe('reguler')
      expect(resInvalid.feeCents).toBe(1500000)
    })

    it('menangani format nama layanan dengan huruf besar dan spasi (case-insensitive & trim)', () => {
      const resExpress = calculateShippingFee('  EXPRESS  ', 10000000)
      expect(resExpress.service).toBe('express')
      expect(resExpress.feeCents).toBe(3000000)

      const resInstant = calculateShippingFee('Instant', 10000000)
      expect(resInstant.service).toBe('instant')
      expect(resInstant.feeCents).toBe(4500000)

      const resCargo = calculateShippingFee('CARGO', 10000000)
      expect(resCargo.service).toBe('cargo')
      expect(resCargo.feeCents).toBe(2500000)
    })
  })

  describe('Threshold Bebas Ongkir Reguler (500k)', () => {
    it('memberikan biaya Rp 15.000 jika subtotal tepat di bawah Rp 500.000', () => {
      const subtotalBelowThreshold = 49999900 // Rp 499.999
      const result = calculateShippingFee('reguler', subtotalBelowThreshold)
      expect(result.service).toBe('reguler')
      expect(result.feeCents).toBe(1500000)
      expect(result.isFree).toBe(false)
    })

    it('memberikan Bebas Ongkir (Rp 0) jika subtotal tepat Rp 500.000', () => {
      const subtotalExactThreshold = 50000000 // Rp 500.000
      const result = calculateShippingFee('reguler', subtotalExactThreshold)
      expect(result.service).toBe('reguler')
      expect(result.feeCents).toBe(0)
      expect(result.isFree).toBe(true)
    })

    it('memberikan Bebas Ongkir (Rp 0) jika subtotal di atas Rp 500.000', () => {
      const subtotalAboveThreshold = 75000000 // Rp 750.000
      const result = calculateShippingFee('reguler', subtotalAboveThreshold)
      expect(result.service).toBe('reguler')
      expect(result.feeCents).toBe(0)
      expect(result.isFree).toBe(true)
    })

    it('menangani subtotal nol atau negatif dengan biaya standar', () => {
      const resZero = calculateShippingFee('reguler', 0)
      expect(resZero.feeCents).toBe(1500000)
      expect(resZero.isFree).toBe(false)

      const resNegative = calculateShippingFee('reguler', -1000)
      expect(resNegative.feeCents).toBe(1500000)
      expect(resNegative.isFree).toBe(false)
    })
  })

  describe('Layanan Premium Tidak Terpengaruh Bebas Ongkir', () => {
    const highSubtotal = 100000000 // Rp 1.000.000

    it('express tetap dikenakan tarif penuh meskipun belanja melebihi 500k', () => {
      const result = calculateShippingFee('express', highSubtotal)
      expect(result.service).toBe('express')
      expect(result.feeCents).toBe(3000000)
      expect(result.isFree).toBe(false)
    })

    it('instant tetap dikenakan tarif penuh meskipun belanja melebihi 500k', () => {
      const result = calculateShippingFee('instant', highSubtotal)
      expect(result.service).toBe('instant')
      expect(result.feeCents).toBe(4500000)
      expect(result.isFree).toBe(false)
    })

    it('cargo tetap dikenakan tarif penuh meskipun belanja melebihi 500k', () => {
      const result = calculateShippingFee('cargo', highSubtotal)
      expect(result.service).toBe('cargo')
      expect(result.feeCents).toBe(2500000)
      expect(result.isFree).toBe(false)
    })
  })

  describe('shippingRateTiers Metadata', () => {
    it('memiliki 4 tingkat pengiriman dengan informasi lengkap', () => {
      expect(shippingRateTiers).toHaveLength(4)
      const ids = shippingRateTiers.map((t) => t.id)
      expect(ids).toEqual(['reguler', 'express', 'instant', 'cargo'])

      const regulerTier = shippingRateTiers.find((t) => t.id === 'reguler')
      expect(regulerTier).toBeDefined()
      expect(regulerTier?.baseFeeCents).toBe(1500000)
      expect(regulerTier?.freeThresholdCents).toBe(50000000)
      expect(regulerTier?.etd).toBe('2-3 Hari Kerja')

      const expressTier = shippingRateTiers.find((t) => t.id === 'express')
      expect(expressTier?.baseFeeCents).toBe(3000000)
      expect(expressTier?.freeThresholdCents).toBeNull()

      const instantTier = shippingRateTiers.find((t) => t.id === 'instant')
      expect(instantTier?.baseFeeCents).toBe(4500000)
      expect(instantTier?.freeThresholdCents).toBeNull()

      const cargoTier = shippingRateTiers.find((t) => t.id === 'cargo')
      expect(cargoTier?.baseFeeCents).toBe(2500000)
      expect(cargoTier?.freeThresholdCents).toBeNull()
    })
  })

  describe('checkoutSchema Validation dengan shipping_service', () => {
    const validBasePayload = {
      items: [{ product_id: 101, qty: 1 }],
      address: {
        name: 'Budi Santoso',
        phone: '081234567890',
        street: 'Jl. Jenderal Sudirman No. 45',
        city: 'Jakarta Selatan',
        postal: '12190',
      },
    }

    it('memberikan nilai default reguler jika shipping_service tidak disertakan', () => {
      const parsed = checkoutSchema.safeParse(validBasePayload)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.shipping_service).toBe('reguler')
        expect(parsed.data.courier_code).toBeUndefined()
      }
    })

    it('menerima seluruh jenis opsi pengiriman yang valid', () => {
      const services: ShippingService[] = ['reguler', 'express', 'instant', 'cargo']
      for (const service of services) {
        const payload = {
          ...validBasePayload,
          shipping_service: service,
          courier_code: 'jne',
        }
        const parsed = checkoutSchema.safeParse(payload)
        expect(parsed.success).toBe(true)
        if (parsed.success) {
          expect(parsed.data.shipping_service).toBe(service)
          expect(parsed.data.courier_code).toBe('jne')
        }
      }
    })

    it('menolak pengiriman dengan service yang tidak terdaftar', () => {
      const payload = {
        ...validBasePayload,
        shipping_service: 'helikopter',
      }
      const parsed = checkoutSchema.safeParse(payload)
      expect(parsed.success).toBe(false)
    })

    it('menolak kode kurir yang tidak terdaftar', () => {
      const payload = {
        ...validBasePayload,
        courier_code: 'kurir_liar',
      }
      const parsed = checkoutSchema.safeParse(payload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('Endpoint Handler Logic (server/api/shipping/calculate.post.ts)', () => {
    it('memvalidasi input skema kalkulasi pengiriman', () => {
      const valid = calculateShippingInputSchema.safeParse({
        service: 'express',
        subtotal_cents: 20000000,
        courier_code: 'sicepat',
      })
      expect(valid.success).toBe(true)

      const empty = calculateShippingInputSchema.safeParse({})
      expect(empty.success).toBe(true)

      const invalidSubtotal = calculateShippingInputSchema.safeParse({
        subtotal_cents: -500,
      })
      expect(invalidSubtotal.success).toBe(false)
    })

    it('menghasilkan kalkulasi pengiriman yang tepat untuk reguler bebas ongkir', () => {
      const result = processShippingCalculation({
        service: 'reguler',
        subtotal_cents: 60000000,
        courier_code: 'jne',
      })

      expect(result.service).toBe('reguler')
      expect(result.courier_code).toBe('jne')
      expect(result.fee_cents).toBe(0)
      expect(result.is_free).toBe(true)
      expect(result.formatted_fee).toBe('Gratis')
      expect(result.etd).toBe('2-3 Hari Kerja')
    })

    it('menghasilkan kalkulasi ongkir reguler berbayar di bawah threshold', () => {
      const result = processShippingCalculation({
        service: 'reguler',
        subtotal_cents: 30000000,
        courier_code: 'pos',
      })

      expect(result.service).toBe('reguler')
      expect(result.courier_code).toBe('pos')
      expect(result.fee_cents).toBe(1500000)
      expect(result.is_free).toBe(false)
      expect(result.formatted_fee).toContain('15.000')
      expect(result.etd).toBe('2-3 Hari Kerja')
    })

    it('menghasilkan kalkulasi ongkir express dengan etd yang sesuai', () => {
      const result = processShippingCalculation({
        service: 'express',
        subtotal_cents: 100000000,
        courier_code: 'jnt',
      })

      expect(result.service).toBe('express')
      expect(result.courier_code).toBe('jnt')
      expect(result.fee_cents).toBe(3000000)
      expect(result.is_free).toBe(false)
      expect(result.formatted_fee).toContain('30.000')
      expect(result.etd).toBe('1 Hari Kerja')
    })

    it('menghasilkan kalkulasi ongkir instant dengan etd yang sesuai', () => {
      const result = processShippingCalculation({
        service: 'instant',
        subtotal_cents: 50000000,
      })

      expect(result.service).toBe('instant')
      expect(result.courier_code).toBeNull()
      expect(result.fee_cents).toBe(4500000)
      expect(result.is_free).toBe(false)
      expect(result.formatted_fee).toContain('45.000')
      expect(result.etd).toBe('Tiba Hari Ini')
    })

    it('menghasilkan kalkulasi ongkir cargo dengan etd yang sesuai', () => {
      const result = processShippingCalculation({
        service: 'cargo',
        subtotal_cents: 80000000,
        courier_code: 'anteraja',
      })

      expect(result.service).toBe('cargo')
      expect(result.courier_code).toBe('anteraja')
      expect(result.fee_cents).toBe(2500000)
      expect(result.is_free).toBe(false)
      expect(result.formatted_fee).toContain('25.000')
      expect(result.etd).toBe('4-7 Hari Kerja')
    })

    it('memanggil handler default calculate.post.ts secara langsung untuk validasi response', async () => {
      const mockEvent = {
        method: 'POST',
        body: {
          service: 'reguler',
          subtotal_cents: 60000000,
          courier_code: 'jne',
        },
      }
      const response = await calculateHandler(mockEvent)
      expect(response.status).toBe('success')
      expect(response.data.service).toBe('reguler')
      expect(response.data.courier_code).toBe('jne')
      expect(response.data.fee_cents).toBe(0)
      expect(response.data.is_free).toBe(true)
      expect(response.data.formatted_fee).toBe('Gratis')
      expect(response.data.etd).toBe('2-3 Hari Kerja')
    })
  })
})
