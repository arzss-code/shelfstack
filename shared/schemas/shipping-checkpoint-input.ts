import { z } from 'zod'
import { checkpointStatusSchema, type CheckpointStatus } from './shipping'

export type { CheckpointStatus }

export const defaultCheckpointTemplates: Record<
  CheckpointStatus,
  { defaultTitle: string; defaultDescription: string }
> = {
  manifested: {
    defaultTitle: 'Pesanan Telah Dimanifes',
    defaultDescription: 'Informasi pengiriman telah diterima dari penjual.',
  },
  picked_up: {
    defaultTitle: 'Paket Telah Diserahkan ke Kurir',
    defaultDescription: 'Paket telah dijemput oleh kurir ekspedisi dan masuk fasilitas sortir.',
  },
  in_transit: {
    defaultTitle: 'Paket Menuju Hub Transit',
    defaultDescription: 'Paket sedang dalam perjalanan transfer logistik antarkota.',
  },
  out_for_delivery: {
    defaultTitle: 'Paket Dibawa Kurir Menuju Alamat',
    defaultDescription: 'Kurir sedang melakukan pengantaran ke alamat tujuan penerima.',
  },
  delivered: {
    defaultTitle: 'Paket Telah Diterima',
    defaultDescription: 'Paket telah berhasil diserahkan kepada penerima di alamat tujuan.',
  },
  returned: {
    defaultTitle: 'Paket Dikembalikan ke Gudang Pengirim',
    defaultDescription: 'Pengiriman gagal atau diminta kembali oleh pengirim.',
  },
}

export const createShippingCheckpointSchema = z.object({
  status: checkpointStatusSchema,
  location: z
    .string()
    .trim()
    .min(2, 'Lokasi minimal 2 karakter')
    .max(100, 'Lokasi maksimal 100 karakter'),
  title: z
    .string()
    .trim()
    .min(2, 'Judul minimal 2 karakter')
    .max(120, 'Judul maksimal 120 karakter')
    .optional(),
  description: z
    .string()
    .trim()
    .min(2, 'Keterangan minimal 2 karakter')
    .max(300, 'Keterangan maksimal 300 karakter')
    .optional(),
})

export type CreateShippingCheckpointInput = z.infer<typeof createShippingCheckpointSchema>
