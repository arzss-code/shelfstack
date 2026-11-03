import type {
  ReturnReasonType,
  ReturnRequestStatus,
  ReturnSolutionType,
} from '../../shared/schemas/return-request'

export const SHELFSTACK_WAREHOUSE_DESTINATION = {
  facility_name: 'Gudang Kurasi Sentral ShelfStack (Pusat RMA & Kendali Mutu)',
  recipient_name: 'Tim Retur & Perlindungan Konsumen ShelfStack',
  street_address: 'Jl. Pemuda No. 88, Kel. Pandansari, Kec. Semarang Tengah',
  city: 'Kota Semarang',
  province: 'Jawa Tengah',
  postal_code: '50132',
  contact_phone: '0812-3456-7890',
  instructions: [
    'Pastikan produk dikemas kembali secara aman menggunakan bubble wrap atau dus pelindung.',
    'Sertakan seluruh komponen, buku panduan, dan kelengkapan boks asli bawaan pabrik.',
    'Tuliskan kode pengajuan retur resmi pada sisi luar kemasan paket pengiriman.',
  ],
}

export const RETURN_REASON_LABELS: Record<ReturnReasonType, string> = {
  defective: 'Cacat Pabrik / Kendala Fungsi',
  damaged_in_transit: 'Barang Rusak Saat Pengiriman',
  wrong_item: 'Produk Tidak Sesuai / Salah Kirim',
  missing_accessories: 'Aksesori / Kelengkapan Kurang',
  other: 'Kendala Teknis Lainnya',
}

export const RETURN_SOLUTION_LABELS: Record<ReturnSolutionType, string> = {
  refund: 'Pengembalian Dana Penuh (Full Refund)',
  replacement: 'Penukaran Barang Baru (Replacement Unit)',
}

export interface ReturnStatusMetadata {
  label: string
  tone: 'warning' | 'info' | 'danger' | 'success'
  step: number
  description: string
}

export const RETURN_STATUS_MAP: Record<ReturnRequestStatus, ReturnStatusMetadata> = {
  requested: {
    label: 'Menunggu Peninjauan',
    tone: 'warning',
    step: 1,
    description: 'Pengajuan retur Anda sedang ditinjau oleh Tim Kendali Mutu dalam 1x24 jam kerja.',
  },
  approved: {
    label: 'Disetujui (Menunggu Kiriman Balik)',
    tone: 'info',
    step: 2,
    description:
      'Pengajuan telah disetujui. Silakan kirimkan unit ke gudang kurasi kami lalu input nomor resi pengiriman.',
  },
  rejected: {
    label: 'Pengajuan Ditolak',
    tone: 'danger',
    step: 0,
    description: 'Pengajuan retur tidak memenuhi syarat kebijakan garansi ShelfStack.',
  },
  item_received: {
    label: 'Barang Diterima di Gudang',
    tone: 'info',
    step: 3,
    description:
      'Unit pengembalian telah tiba di gudang dan sedang melewati verifikasi fisik teknisi.',
  },
  completed: {
    label: 'Klaim Selesai',
    tone: 'success',
    step: 4,
    description: 'Resolusi klaim telah selesai diproses.',
  },
  cancelled: {
    label: 'Pengajuan Dibatalkan',
    tone: 'info',
    step: 0,
    description: 'Tiket pengajuan retur telah dibatalkan oleh pengguna.',
  },
}

export function checkReturnWindowEligibility(order: {
  status: string
  completed_at?: string | null
}): { isEligible: boolean; reason?: string; remainingDays?: number } {
  if (order.status !== 'completed') {
    return {
      isEligible: false,
      reason: 'Pengajuan retur hanya dapat diproses untuk pesanan yang telah selesai diterima.',
    }
  }

  if (!order.completed_at) {
    return { isEligible: true, remainingDays: 7 }
  }

  const completedTime = new Date(order.completed_at).getTime()
  const currentTime = Date.now()
  const diffDays = (currentTime - completedTime) / (1000 * 60 * 60 * 24)

  if (diffDays > 7) {
    return {
      isEligible: false,
      reason: 'Jendela jaminan retur 7 hari sejak penerimaan pesanan telah berakhir.',
    }
  }

  const remainingDays = Math.max(0, Math.ceil(7 - diffDays))
  return { isEligible: true, remainingDays }
}
