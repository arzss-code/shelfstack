export type TransactionalEmailType = 'order_placed' | 'payment_success' | 'order_shipped'

export interface EmailOrderItem {
  name: string
  quantity: number
  price: number
  variantName?: string | null
  imageUrl?: string | null
}

export interface EmailOrderData {
  id: string
  created_at?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  street?: string | null
  city?: string | null
  postal?: string | null
  notes?: string | null
  shipping_service?: string | null
  courier_code?: string | null
  tracking_number?: string | null
  items: EmailOrderItem[]
  subtotal_cents?: number
  coupon_code?: string | null
  coupon_discount_cents?: number
  coins_used?: number
  coins_discount_cents?: number
  shipping_fee_cents?: number
  total_cents: number
}

function formatCurrency(cents: number): string {
  const rupiah = Math.round(cents / 100)
  return 'Rp ' + rupiah.toLocaleString('id-ID')
}

export function generateEmailSubject(type: TransactionalEmailType, order: { id: string }): string {
  const shortId = order.id.slice(0, 8).toUpperCase()
  switch (type) {
    case 'order_placed':
      return `Konfirmasi Pemesanan #${shortId} [ShelfStack]`
    case 'payment_success':
      return `Pembayaran Berhasil untuk Pesanan #${shortId} [ShelfStack]`
    case 'order_shipped':
      return `Pesanan Anda Sedang Dikirim #${shortId} [ShelfStack]`
  }
}

export function generateEmailHtml(type: TransactionalEmailType, order: EmailOrderData): string {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const customerName = order.customer_name || 'Pelanggan Setia'

  let bannerTitle = 'Konfirmasi Pemesanan'
  let bannerDesc =
    'Terima kasih telah berbelanja di ShelfStack. Pesanan Anda telah tercatat dan menunggu pembayaran.'
  let statusBadgeColor = '#d97706'
  let statusBadgeText = 'Menunggu Pembayaran'

  if (type === 'payment_success') {
    bannerTitle = 'Pembayaran Diterima'
    bannerDesc =
      'Pembayaran Anda telah diverifikasi secara instan. Pesanan Anda saat ini sedang dikemas oleh tim gudang ShelfStack.'
    statusBadgeColor = '#059669'
    statusBadgeText = 'Lunas & Diproses'
  } else if (type === 'order_shipped') {
    bannerTitle = 'Pesanan Sedang Dikirim'
    bannerDesc =
      'Kabar gembira! Paket pesanan Anda telah diserahkan kepada kurir mitra ekspedisi dan sedang menuju alamat Anda.'
    statusBadgeColor = '#0066ff'
    statusBadgeText = 'Dalam Pengiriman'
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${item.name}</div>
          ${item.variantName ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Varian: ${item.variantName}</div>` : ''}
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${item.quantity} x ${formatCurrency(item.price * 100)}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">
          ${formatCurrency(item.price * item.quantity * 100)}
        </td>
      </tr>
    `,
    )
    .join('')

  const subtotalCents =
    order.subtotal_cents || order.items.reduce((acc, i) => acc + i.price * i.quantity * 100, 0)
  const couponDiscount = order.coupon_discount_cents || 0
  const coinsDiscount = order.coins_discount_cents || 0
  const shippingFee = order.shipping_fee_cents || 0

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generateEmailSubject(type, order)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 28px; text-align: left;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">SHELF<span style="color: #0066ff;">STACK</span></div>
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Kurasi Alat Presisi &amp; Ruang Kerja</div>
                  </td>
                  <td align="right" style="vertical-align: middle; white-space: nowrap; padding-left: 12px;">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: ${statusBadgeColor}; border-radius: 9999px; white-space: nowrap;">${statusBadgeText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 28px 32px 20px 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${bannerTitle}</h1>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">Halo <strong>${customerName}</strong>, ${bannerDesc}</p>
            </td>
          </tr>

          <!-- Tracking Highlight (for shipped) -->
          ${
            type === 'order_shipped' && order.tracking_number
              ? `
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px;">Nomor Resi Pengiriman</div>
                <div style="font-size: 15px; font-weight: 700; letter-spacing: 0.5px; color: #1e3a8a; margin-top: 4px;">${order.tracking_number}</div>
                <div style="font-size: 12px; color: #3b82f6; margin-top: 4px;">Ekspedisi: <strong>${(order.courier_code || 'JNE').toUpperCase()}</strong> (${order.shipping_service || 'Reguler'})</div>
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Order Summary Meta -->
          <tr>
            <td style="padding: 0 32px 16px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; padding: 14px 16px; border: 1px solid #f1f5f9;">
                <tr>
                  <td style="font-size: 12px; color: #64748b;">ID Pesanan:</td>
                  <td align="right" style="font-size: 12px; font-weight: 700; color: #0f172a;">#${shortId}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding-top: 6px;">Layanan Kirim:</td>
                  <td align="right" style="font-size: 12px; font-weight: 600; color: #0f172a; padding-top: 6px;">${order.shipping_service || 'Reguler'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <thead>
                  <tr>
                    <th align="left" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Rincian Barang</th>
                    <th align="right" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 12px; line-height: 1.8;">
                <tr>
                  <td style="color: #64748b;">Subtotal Produk</td>
                  <td align="right" style="font-weight: 600; color: #0f172a;">${formatCurrency(subtotalCents)}</td>
                </tr>
                ${
                  couponDiscount > 0
                    ? `
                <tr>
                  <td style="color: #059669;">Diskon Kupon (${order.coupon_code || 'PROMO'})</td>
                  <td align="right" style="font-weight: 600; color: #059669;">-${formatCurrency(couponDiscount)}</td>
                </tr>
                `
                    : ''
                }
                ${
                  coinsDiscount > 0
                    ? `
                <tr>
                  <td style="color: #d97706;">Potongan Koin (${order.coins_used || 0} Koin)</td>
                  <td align="right" style="font-weight: 600; color: #d97706;">-${formatCurrency(coinsDiscount)}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <td style="color: #64748b;">Biaya Pengiriman</td>
                  <td align="right" style="font-weight: 600; color: #0f172a;">${shippingFee === 0 ? '<span style="color: #059669; font-weight: 600;">GRATIS</span>' : formatCurrency(shippingFee)}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 700; color: #0f172a; padding-top: 8px; border-top: 1px solid #e2e8f0;">Total Tagihan</td>
                  <td align="right" style="font-size: 15px; font-weight: 800; color: #0066ff; padding-top: 8px; border-top: 1px solid #e2e8f0;">${formatCurrency(order.total_cents)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Alamat Pengiriman</div>
                <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${order.customer_name || 'Penerima'} (${order.customer_phone || '-'})</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${order.street || ''}, ${order.city || ''} ${order.postal || ''}</div>
                ${order.notes ? `<div style="font-size: 11px; color: #d97706; margin-top: 4px; font-style: italic;">Catatan: "${order.notes}"</div>` : ''}
              </div>
            </td>
          </tr>

          <!-- Action Button CTA -->
          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="https://shelfstack.co.id/orders/${order.id}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                Buka Rincian Pesanan
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Email ini dikirim secara otomatis oleh sistem ShelfStack.<br>
                Jika Anda memiliki pertanyaan, hubungi tim kami di <a href="mailto:support@shelfstack.co.id" style="color: #64748b; text-decoration: underline;">support@shelfstack.co.id</a>.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">&copy; 2026 ShelfStack Indonesia. Hak cipta dilindungi.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
