import type { SupportThreadStatus } from '../../shared/schemas/support-chat'

export const WELCOME_BOT_MESSAGE =
  'Halo! Selamat datang di Layanan Bantuan Pelanggan ShelfStack. Tim CS kami siap membantu kendala pesanan, informasi kurasi produk, atau panduan transaksi Anda. Mohon tinggalkan detail pertanyaan Anda di sini, tim kami segera merespons secepatnya!'

export const SYSTEM_WELCOME_MESSAGE = WELCOME_BOT_MESSAGE

export interface SupportCannedResponse {
  key: string
  label: string
  text: string
}

export const SUPPORT_CANNED_RESPONSES: SupportCannedResponse[] = [
  {
    key: 'greeting',
    label: 'Salam Pembuka',
    text: 'Halo! Ada yang bisa kami bantu terkait pesanan Anda hari ini?',
  },
  {
    key: 'ask_order_id',
    label: 'Permintaan Nomor Pesanan',
    text: 'Boleh informasikan nomor pesanan resmi Anda?',
  },
  {
    key: 'shipping_info',
    label: 'Informasi Estimasi Pengiriman',
    text: 'Pesanan Anda saat ini dalam proses penyiapan oleh tim gudang sentral.',
  },
  {
    key: 'refund_processed',
    label: 'Konfirmasi Pengembalian Dana',
    text: 'Pengajuan pengembalian dana telah berhasil diproses.',
  },
  {
    key: 'closing_resolved',
    label: 'Salam Penutup & Kendala Selesai',
    text: 'Senang bisa membantu Anda! Selamat beraktivitas.',
  },
]

export interface SupportStatusMetadata {
  label: string
  tone: 'info' | 'warning' | 'primary' | 'success'
  description: string
}

export const SUPPORT_STATUS_MAP: Record<SupportThreadStatus, SupportStatusMetadata> = {
  open: {
    label: 'Baru Dibuka',
    tone: 'info',
    description: 'Thread bantuan baru dibuka dan menunggu penanganan tim CS.',
  },
  waiting_admin: {
    label: 'Menunggu Balasan CS',
    tone: 'warning',
    description: 'Pelanggan telah mengirim pesan dan menunggu tanggapan CS.',
  },
  waiting_customer: {
    label: 'Menunggu Pelanggan',
    tone: 'primary',
    description: 'CS telah merespons dan menunggu tanggapan dari pelanggan.',
  },
  resolved: {
    label: 'Selesai',
    tone: 'success',
    description: 'Kendala telah diselesaikan dan percakapan ditutup.',
  },
}
