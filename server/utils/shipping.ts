import type {
  CheckpointStatus,
  CourierCode,
  ShippingCheckpoint,
} from '../../shared/schemas/shipping'

/**
 * Menghasilkan nomor resi realistis berdasarkan kode kurir
 */
export function generateTrackingNumber(courierCode: CourierCode): string {
  const prefix =
    {
      jne: 'SS-JNE',
      sicepat: 'SS-SCP',
      jnt: 'SS-JNT',
      anteraja: 'SS-ANTR',
      pos: 'SS-POS',
    }[courierCode] || 'SS-LOG'

  const timestampPart = Date.now().toString().slice(-6)
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString()

  return `${prefix}-${timestampPart}${randomPart}`
}

/**
 * Menyembunyikan nama penerima demi privasi (Contoh: "Arya Setiawan" -> "Arya S***")
 */
export function maskRecipientName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return 'Pelanggan'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    const name = parts[0]!
    return name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`
  }
  return `${parts[0]} ${parts
    .slice(1)
    .map((p) => `${p[0]}***`)
    .join(' ')}`
}

/**
 * Menyembunyikan nomor telepon demi privasi (Contoh: "081234567890" -> "0812-****-7890")
 */
export function maskRecipientPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '08**-****-****'
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length < 8) return '08**-****'
  const prefix = cleanPhone.slice(0, 4)
  const suffix = cleanPhone.slice(-4)
  return `${prefix}-****-${suffix}`
}

/**
 * Menghasilkan linimasa checkpoint awal saat pesanan beralih ke status shipped
 */
export function buildInitialShippingCheckpoints(
  orderId: string,
  trackingNumber: string,
  courierName: string,
  destinationCity: string,
): Array<Omit<ShippingCheckpoint, 'id'>> {
  const now = Date.now()
  const city = destinationCity?.trim() || 'Kota Tujuan'

  return [
    {
      order_id: orderId,
      tracking_number: trackingNumber,
      status: 'manifested' as CheckpointStatus,
      title: 'Instruksi Pengiriman Diterima',
      description: `Data pengiriman telah dicatat di sistem ${courierName}. Paket disiapkan di gudang ShelfStack.`,
      location: 'ShelfStack Fulfillment Center, Jakarta',
      created_at: new Date(now - 1000 * 60 * 90).toISOString(), // 90 mnt lalu
    },
    {
      order_id: orderId,
      tracking_number: trackingNumber,
      status: 'picked_up' as CheckpointStatus,
      title: 'Paket Di-pick Up oleh Kurir',
      description: `Paket pesanan telah diserahkan kepada kurir ${courierName} dan menuju ke pusat sortir origin.`,
      location: 'Origin Gateway Jakarta Barat',
      created_at: new Date(now - 1000 * 60 * 30).toISOString(), // 30 mnt lalu
    },
    {
      order_id: orderId,
      tracking_number: trackingNumber,
      status: 'in_transit' as CheckpointStatus,
      title: 'Dalam Perjalanan Menuju Hub Transit',
      description: `Paket sedang dalam proses transfer antarkota menuju fasilitas logistik di ${city}.`,
      location: 'Main Transit Hub, Jakarta',
      created_at: new Date(now).toISOString(),
    },
  ]
}

/**
 * Menghasilkan checkpoint saat pesanan selesai / sampai (delivered)
 */
export function buildDeliveredShippingCheckpoints(
  orderId: string,
  trackingNumber: string,
  recipientName: string,
  destinationCity: string,
): Array<Omit<ShippingCheckpoint, 'id'>> {
  const now = Date.now()
  const city = destinationCity?.trim() || 'Kota Tujuan'
  const name = recipientName?.trim() || 'Penerima'

  return [
    {
      order_id: orderId,
      tracking_number: trackingNumber,
      status: 'out_for_delivery' as CheckpointStatus,
      title: 'Paket Sedang Diantar oleh Kurir',
      description: `Paket telah tiba di hub terdekat dan sedang dibawa kurir menuju alamat penerima di ${city}.`,
      location: `Delivery Hub, ${city}`,
      created_at: new Date(now - 1000 * 60 * 45).toISOString(), // 45 mnt lalu
    },
    {
      order_id: orderId,
      tracking_number: trackingNumber,
      status: 'delivered' as CheckpointStatus,
      title: 'Paket Telah Berhasil Diterima',
      description: `Paket telah diterima dengan baik di alamat tujuan oleh ${name}.`,
      location: city,
      created_at: new Date(now).toISOString(),
    },
  ]
}

/**
 * Menyensor nama penerima di dalam teks deskripsi checkpoint publik
 */
export function maskCheckpointDescription(description: string, rawRecipientName?: string): string {
  if (!description) return ''
  let sanitized = description
  if (rawRecipientName && rawRecipientName.trim().length > 1) {
    const rawTrimmed = rawRecipientName.trim()
    const masked = maskRecipientName(rawTrimmed)
    sanitized = sanitized.replaceAll(rawTrimmed, masked)
  }
  return sanitized
}
