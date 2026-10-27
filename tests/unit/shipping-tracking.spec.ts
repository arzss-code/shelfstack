import { describe, expect, it } from 'vitest'
import {
  courierCodeSchema,
  publicTrackingResultSchema,
  shipOrderInputSchema,
  shippingCheckpointSchema,
  supportedCouriers,
  trackingLookupSchema,
} from '../../shared/schemas/shipping'
import {
  buildDeliveredShippingCheckpoints,
  buildInitialShippingCheckpoints,
  generateTrackingNumber,
  maskRecipientName,
  maskRecipientPhone,
} from '../../server/utils/shipping'

describe('Shipping & Order Tracking Schemas', () => {
  it('mendukung 5 ekspedisi resmi kurir logistik ShelfStack', () => {
    expect(supportedCouriers.length).toBe(5)
    const codes = supportedCouriers.map((c) => c.code)

    codes.forEach((code) => {
      expect(courierCodeSchema.safeParse(code).success).toBe(true)
    })

    expect(courierCodeSchema.safeParse('fedex_invalid').success).toBe(false)
  })

  it('memvalidasi shipOrderInputSchema dari modal admin', () => {
    const valid = {
      courier_code: 'jne',
      courier_name: 'JNE Express',
      tracking_number: 'SS-JNE-8829103941',
    }

    expect(shipOrderInputSchema.safeParse(valid).success).toBe(true)

    const invalid = {
      courier_code: 'unknown' as any,
      courier_name: '',
      tracking_number: '1',
    }
    expect(shipOrderInputSchema.safeParse(invalid).success).toBe(false)
  })

  it('memvalidasi trackingLookupSchema untuk form pencarian resi publik', () => {
    expect(trackingLookupSchema.safeParse({ q: 'SS-JNE-12345' }).success).toBe(true)
    expect(trackingLookupSchema.safeParse({ q: 'a' }).success).toBe(false)
    expect(trackingLookupSchema.safeParse({ q: '   ' }).success).toBe(false)
  })

  it('memvalidasi checkpoint dan publicTrackingResultSchema dengan data tersensor', () => {
    const checkpoint = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      tracking_number: 'SS-JNE-12345',
      status: 'in_transit' as const,
      title: 'Dalam Perjalanan Menuju Hub Transit',
      description: 'Paket sedang dalam proses transfer antarkota.',
      location: 'Main Transit Hub, Jakarta',
      created_at: new Date().toISOString(),
    }

    expect(shippingCheckpointSchema.safeParse(checkpoint).success).toBe(true)

    const publicResult = {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      tracking_number: 'SS-JNE-12345',
      courier_code: 'jne' as const,
      courier_name: 'JNE Express',
      status: 'shipped',
      recipient_name_masked: 'Arya S***',
      recipient_phone_masked: '0812-****-7890',
      destination_city: 'Jakarta Pusat',
      checkpoints: [checkpoint],
    }

    expect(publicTrackingResultSchema.safeParse(publicResult).success).toBe(true)
  })
})

describe('Shipping Utilities & Generator Logic', () => {
  it('menghasilkan nomor resi unik sesuai prefix kurir', () => {
    const resiJne = generateTrackingNumber('jne')
    expect(resiJne.startsWith('SS-JNE-')).toBe(true)
    expect(resiJne.length).toBeGreaterThan(12)

    const resiSicepat = generateTrackingNumber('sicepat')
    expect(resiSicepat.startsWith('SS-SCP-')).toBe(true)

    const resiJnt = generateTrackingNumber('jnt')
    expect(resiJnt.startsWith('SS-JNT-')).toBe(true)

    const resiAnteraja = generateTrackingNumber('anteraja')
    expect(resiAnteraja.startsWith('SS-ANTR-')).toBe(true)

    const resiPos = generateTrackingNumber('pos')
    expect(resiPos.startsWith('SS-POS-')).toBe(true)
  })

  it('melakukan masking nama penerima secara aman untuk privasi publik', () => {
    expect(maskRecipientName('Arya Setiawan')).toBe('Arya S***')
    expect(maskRecipientName('Budi')).toBe('Bu***')
    expect(maskRecipientName('John Michael Doe')).toBe('John M*** D***')
    expect(maskRecipientName('')).toBe('Pelanggan')
  })

  it('melakukan masking nomor telepon penerima dengan menyembunyikan 4 digit tengah', () => {
    expect(maskRecipientPhone('081234567890')).toBe('0812-****-7890')
    expect(maskRecipientPhone('+6281298765432')).toBe('6281-****-5432')
    expect(maskRecipientPhone('')).toBe('08**-****-****')
  })

  it('membangun checkpoints pengiriman awal saat pesanan shipped', () => {
    const cps = buildInitialShippingCheckpoints(
      'order-123',
      'SS-JNE-12345',
      'JNE Express',
      'Surabaya',
    )

    expect(cps.length).toBe(3)
    expect(cps[0]?.status).toBe('manifested')
    expect(cps[1]?.status).toBe('picked_up')
    expect(cps[2]?.status).toBe('in_transit')
    expect(cps.every((c) => c.order_id === 'order-123')).toBe(true)
    expect(cps.every((c) => c.tracking_number === 'SS-JNE-12345')).toBe(true)
    expect(cps[2]?.description).toContain('Surabaya')
  })

  it('membangun checkpoints pengiriman delivered saat pesanan sampai', () => {
    const cps = buildDeliveredShippingCheckpoints(
      'order-123',
      'SS-JNE-12345',
      'Arya Setiawan',
      'Bandung',
    )

    expect(cps.length).toBe(2)
    expect(cps[0]?.status).toBe('out_for_delivery')
    expect(cps[1]?.status).toBe('delivered')
    expect(cps[1]?.description).toContain('Arya Setiawan')
    expect(cps[1]?.location).toBe('Bandung')
  })
})
