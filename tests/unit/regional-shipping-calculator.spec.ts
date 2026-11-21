import { describe, expect, it } from 'vitest'
import {
  resolveShippingZone,
  calculateShippingFee,
  getZoneShippingRateTiers,
  type ShippingZone,
} from '../../shared/schemas/shipping'
import calculateHandler, {
  processShippingCalculation,
} from '../../server/api/shipping/calculate.post'

describe('Regional Dynamic Shipping Calculation Suite (Semarang Hub)', () => {
  describe('Geographic Zone Resolution (resolveShippingZone)', () => {
    it('resolves Central Java cities and province to central_java zone', () => {
      expect(resolveShippingZone('Semarang')).toBe('central_java')
      expect(resolveShippingZone('Kota Semarang')).toBe('central_java')
      expect(resolveShippingZone('Surakarta')).toBe('central_java')
      expect(resolveShippingZone('Solo')).toBe('central_java')
      expect(resolveShippingZone('Banyumas')).toBe('central_java')
      expect(resolveShippingZone({ province: 'Jawa Tengah', city: 'Kudus' })).toBe('central_java')
      expect(resolveShippingZone({ province: 'Central Java', city: 'Magelang' })).toBe(
        'central_java',
      )
    })

    it('resolves other Java provinces and major cities to java_other zone', () => {
      expect(resolveShippingZone('Jakarta Selatan')).toBe('java_other')
      expect(resolveShippingZone('Kota Bandung')).toBe('java_other')
      expect(resolveShippingZone('Surabaya')).toBe('java_other')
      expect(resolveShippingZone('Tangerang')).toBe('java_other')
      expect(resolveShippingZone({ province: 'DKI Jakarta', city: 'Jakarta Pusat' })).toBe(
        'java_other',
      )
      expect(resolveShippingZone({ province: 'Jawa Barat', city: 'Bekasi' })).toBe('java_other')
      expect(resolveShippingZone({ province: 'Jawa Timur', city: 'Malang' })).toBe('java_other')
      expect(resolveShippingZone({ province: 'Banten', city: 'Serang' })).toBe('java_other')
      expect(resolveShippingZone({ province: 'DI Yogyakarta', city: 'Sleman' })).toBe('java_other')
    })

    it('resolves outer island destinations to outer_java zone', () => {
      expect(resolveShippingZone('Medan')).toBe('outer_java')
      expect(resolveShippingZone('Makassar')).toBe('outer_java')
      expect(resolveShippingZone('Denpasar')).toBe('outer_java')
      expect(resolveShippingZone({ province: 'Sumatera Utara', city: 'Medan' })).toBe('outer_java')
      expect(resolveShippingZone({ province: 'Bali', city: 'Badung' })).toBe('outer_java')
      expect(resolveShippingZone({ province: 'Kalimantan Timur', city: 'Balikpapan' })).toBe(
        'outer_java',
      )
      expect(resolveShippingZone({ province: 'Papua', city: 'Jayapura' })).toBe('outer_java')
    })

    it('returns null for null, undefined, or empty destination string', () => {
      expect(resolveShippingZone(null)).toBeNull()
      expect(resolveShippingZone(undefined)).toBeNull()
      expect(resolveShippingZone('')).toBeNull()
      expect(resolveShippingZone({ province: '', city: '' })).toBeNull()
    })
  })

  describe('Zone-Based Shipping Rate Calculation', () => {
    describe('Zone 1: Semarang & Central Java (Origin Hub)', () => {
      const dest = { city: 'Semarang', province: 'Jawa Tengah' }

      it('applies Rp12.000 for reguler service below threshold', () => {
        const res = calculateShippingFee('reguler', 20000000, dest)
        expect(res.service).toBe('reguler')
        expect(res.feeCents).toBe(1200000)
        expect(res.isFree).toBe(false)
        expect(res.zone).toBe('central_java')
        expect(res.etd).toBe('1-2 Hari Kerja')
      })

      it('applies Rp20.000 for express service', () => {
        const res = calculateShippingFee('express', 20000000, dest)
        expect(res.feeCents).toBe(2000000)
        expect(res.isFree).toBe(false)
        expect(res.zone).toBe('central_java')
      })

      it('applies Rp30.000 for instant service', () => {
        const res = calculateShippingFee('instant', 20000000, dest)
        expect(res.feeCents).toBe(3000000)
        expect(res.isAvailable).toBe(true)
      })

      it('applies Rp20.000 for cargo service', () => {
        const res = calculateShippingFee('cargo', 20000000, dest)
        expect(res.feeCents).toBe(2000000)
      })
    })

    describe('Zone 2: Pulau Jawa Lainnya (DKI, Jabar, Jatim, Banten, DIY)', () => {
      const dest = { city: 'Jakarta Selatan', province: 'DKI Jakarta' }

      it('applies Rp16.000 for reguler service below threshold', () => {
        const res = calculateShippingFee('reguler', 25000000, dest)
        expect(res.service).toBe('reguler')
        expect(res.feeCents).toBe(1600000)
        expect(res.isFree).toBe(false)
        expect(res.zone).toBe('java_other')
        expect(res.etd).toBe('2-3 Hari Kerja')
      })

      it('applies Rp28.000 for express service', () => {
        const res = calculateShippingFee('express', 25000000, dest)
        expect(res.feeCents).toBe(2800000)
      })

      it('applies Rp45.000 for instant service', () => {
        const res = calculateShippingFee('instant', 25000000, dest)
        expect(res.feeCents).toBe(4500000)
        expect(res.isAvailable).toBe(true)
      })

      it('applies Rp25.000 for cargo service', () => {
        const res = calculateShippingFee('cargo', 25000000, dest)
        expect(res.feeCents).toBe(2500000)
      })
    })

    describe('Zone 3: Luar Pulau Jawa (Sumatera, Bali, Kalimantan, etc.)', () => {
      const dest = { city: 'Medan', province: 'Sumatera Utara' }

      it('applies Rp32.000 for reguler service below threshold', () => {
        const res = calculateShippingFee('reguler', 20000000, dest)
        expect(res.service).toBe('reguler')
        expect(res.feeCents).toBe(3200000)
        expect(res.isFree).toBe(false)
        expect(res.zone).toBe('outer_java')
        expect(res.etd).toBe('3-5 Hari Kerja')
      })

      it('applies Rp50.000 for express service', () => {
        const res = calculateShippingFee('express', 20000000, dest)
        expect(res.feeCents).toBe(5000000)
      })

      it('marks instant service as unavailable for outer Java destinations', () => {
        const res = calculateShippingFee('instant', 20000000, dest)
        expect(res.isAvailable).toBe(false)
        expect(res.feeCents).toBe(0)
        expect(res.etd).toBe('Tidak Tersedia')
      })

      it('applies Rp38.000 for cargo service', () => {
        const res = calculateShippingFee('cargo', 20000000, dest)
        expect(res.feeCents).toBe(3800000)
      })
    })
  })

  describe('Universal Free Shipping Threshold (Rp500.000) Across All Zones', () => {
    const highSubtotal = 60000000 // Rp600.000

    it('grants free shipping for reguler in Central Java', () => {
      const res = calculateShippingFee('reguler', highSubtotal, 'Semarang')
      expect(res.isFree).toBe(true)
      expect(res.feeCents).toBe(0)
    })

    it('grants free shipping for reguler in Java Other', () => {
      const res = calculateShippingFee('reguler', highSubtotal, 'Bandung')
      expect(res.isFree).toBe(true)
      expect(res.feeCents).toBe(0)
    })

    it('grants free shipping for reguler in Outer Java', () => {
      const res = calculateShippingFee('reguler', highSubtotal, 'Makassar')
      expect(res.isFree).toBe(true)
      expect(res.feeCents).toBe(0)
    })

    it('does not waive fees for premium express/cargo services even above threshold', () => {
      const resExpress = calculateShippingFee('express', highSubtotal, 'Makassar')
      expect(resExpress.isFree).toBe(false)
      expect(resExpress.feeCents).toBe(5000000)

      const resCargo = calculateShippingFee('cargo', highSubtotal, 'Semarang')
      expect(resCargo.isFree).toBe(false)
      expect(resCargo.feeCents).toBe(2000000)
    })
  })

  describe('getZoneShippingRateTiers Helper', () => {
    it('returns zone-adjusted rate tiers for Semarang destination', () => {
      const tiers = getZoneShippingRateTiers('Semarang')
      expect(tiers).toHaveLength(4)

      const reguler = tiers.find((t) => t.id === 'reguler')
      expect(reguler?.baseFeeCents).toBe(1200000)
      expect(reguler?.etd).toBe('1-2 Hari Kerja')

      const express = tiers.find((t) => t.id === 'express')
      expect(express?.baseFeeCents).toBe(2000000)
    })

    it('returns zone-adjusted rate tiers for Medan destination', () => {
      const tiers = getZoneShippingRateTiers('Medan')
      const reguler = tiers.find((t) => t.id === 'reguler')
      expect(reguler?.baseFeeCents).toBe(3200000)

      const instant = tiers.find((t) => t.id === 'instant')
      expect(instant?.description).toContain('tidak tersedia')
    })
  })

  describe('API Calculation Endpoint with Destination Input', () => {
    it('processShippingCalculation incorporates destination and returns zone metadata', () => {
      const result = processShippingCalculation({
        service: 'reguler',
        subtotal_cents: 25000000,
        destination_city: 'Semarang',
        destination_province: 'Jawa Tengah',
      })

      expect(result.service).toBe('reguler')
      expect(result.fee_cents).toBe(1200000)
      expect(result.zone).toBe('central_java')
      expect(result.formatted_fee).toContain('12.000')
      expect(result.is_available).toBe(true)
    })

    it('processShippingCalculation correctly identifies unavailable instant for outer Java', () => {
      const result = processShippingCalculation({
        service: 'instant',
        subtotal_cents: 25000000,
        destination_city: 'Denpasar',
        destination_province: 'Bali',
      })

      expect(result.service).toBe('instant')
      expect(result.is_available).toBe(false)
      expect(result.formatted_fee).toBe('Tidak Tersedia')
    })

    it('calculateHandler processes POST request with regional parameters successfully', async () => {
      const mockEvent = {
        method: 'POST',
        body: {
          service: 'express',
          subtotal_cents: 20000000,
          destination_city: 'Surabaya',
          destination_province: 'Jawa Timur',
        },
      }
      const response = await calculateHandler(mockEvent)
      expect(response.status).toBe('success')
      expect(response.data.service).toBe('express')
      expect(response.data.fee_cents).toBe(2800000)
      expect(response.data.zone).toBe('java_other')
    })
  })
})
