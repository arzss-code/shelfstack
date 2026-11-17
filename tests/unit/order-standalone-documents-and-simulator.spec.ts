import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Order Standalone Documents & Tracking Simulator Suite', () => {
  const root = process.cwd()

  const filesToCheck = [
    'server/api/admin/orders/[id]/simulate-tracking.post.ts',
    'app/pages/orders/[id]/invoice.vue',
    'app/pages/orders/[id]/waybill.vue',
    'app/pages/account/orders.vue',
    'app/features/orders/components/OrderCard.vue',
    'app/composables/useAdminOrderDetail.ts',
    'app/pages/admin/orders/[id].vue',
  ]

  it('memastikan seluruh berkas implementasi baru mematuhi batas <= 300 baris', () => {
    for (const rel of filesToCheck) {
      const fullPath = path.resolve(root, rel)
      expect(fs.existsSync(fullPath), `Berkas ${rel} tidak ditemukan`).toBe(true)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const lines = content.split('\n').length
      expect(lines, `${rel} melebihi 300 baris (${lines})`).toBeLessThanOrEqual(300)
    }
  })

  it('memastikan tidak ada karakter em dash di seluruh berkas baru dan modifikasi', () => {
    const emDash = String.fromCharCode(8212)
    for (const rel of filesToCheck) {
      const fullPath = path.resolve(root, rel)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content.includes(emDash), `${rel} mengandung em dash terlarang`).toBe(false)
    }
  })

  it('memastikan tidak ada tipe data any di berkas baru', () => {
    const codeFiles = [
      'server/api/admin/orders/[id]/simulate-tracking.post.ts',
      'app/composables/useAdminOrderDetail.ts',
    ]
    for (const rel of codeFiles) {
      const fullPath = path.resolve(root, rel)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content).not.toMatch(/:\s*any\b/)
    }
  })

  it('memverifikasi halaman mandiri invoice.vue memiliki penanda cetak dan format resmi', () => {
    const fullPath = path.resolve(root, 'app/pages/orders/[id]/invoice.vue')
    const content = fs.readFileSync(fullPath, 'utf-8')
    expect(content).toContain('FAKTUR PENJUALAN')
    expect(content).toContain('PT ShelfStack Niaga Digital')
    expect(content).toContain('NPWP')
    expect(content).toContain('no-print')
    expect(content).toContain('@media print')
    expect(content).toContain('window.print()')
  })

  it('memverifikasi halaman mandiri waybill.vue memiliki format thermal label A6', () => {
    const fullPath = path.resolve(root, 'app/pages/orders/[id]/waybill.vue')
    const content = fs.readFileSync(fullPath, 'utf-8')
    expect(content).toContain('routingHubCode')
    expect(content).toContain('barcodeSvg')
    expect(content).toContain('quickScanQrSvg')
    expect(content).toContain('shipping-label-sheet')
    expect(content).toContain('100mm')
    expect(content).toContain('@media print')
  })

  it('memverifikasi redirect riwayat pesanan akun di account/orders.vue', () => {
    const fullPath = path.resolve(root, 'app/pages/account/orders.vue')
    const content = fs.readFileSync(fullPath, 'utf-8')
    expect(content).toContain("navigateTo('/orders'")
  })

  it('memverifikasi tombol pintasan invoice di OrderCard.vue', () => {
    const fullPath = path.resolve(root, 'app/features/orders/components/OrderCard.vue')
    const content = fs.readFileSync(fullPath, 'utf-8')
    expect(content).toContain('/orders/${order.id}/invoice')
  })

  it('memverifikasi ketersediaan tombol simulasi kurir di useAdminOrderDetail dan halaman admin', () => {
    const composablePath = path.resolve(root, 'app/composables/useAdminOrderDetail.ts')
    const composableContent = fs.readFileSync(composablePath, 'utf-8')
    expect(composableContent).toContain('handleSimulateTracking')
    expect(composableContent).toContain('/api/admin/orders/${orderId}/simulate-tracking')

    const pagePath = path.resolve(root, 'app/pages/admin/orders/[id].vue')
    const pageContent = fs.readFileSync(pagePath, 'utf-8')
    expect(pageContent).toContain('handleSimulateTracking')
    expect(pageContent).toContain('Simulasi Kurir')
  })

  it('memverifikasi dukungan query param q, order_id, dan ref pada halaman tracking.vue', () => {
    const trackingPath = path.resolve(root, 'app/pages/tracking.vue')
    const trackingContent = fs.readFileSync(trackingPath, 'utf-8')
    expect(trackingContent).toContain('route.query.q')
    expect(trackingContent).toContain('route.query.order_id')
    expect(trackingContent).toContain('route.query.ref')
  })
})
