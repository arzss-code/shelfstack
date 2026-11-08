import type {
  SendSupportMessageInput,
  SupportAttachmentType,
  SupportMessageItem,
} from '~~/shared/schemas/support-chat'

export const MAX_SUPPORT_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_SUPPORT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function parseSendPayload(
  input:
    | string
    | {
        message_text: string
        attachment_url?: string | null
        attachment_type?: SupportAttachmentType | null
        attached_order_id?: string | null
        attached_product_id?: number | null
      },
): SendSupportMessageInput {
  if (typeof input === 'string') return { message_text: input }
  return {
    message_text: input.message_text,
    attachment_url: input.attachment_url ?? null,
    attachment_type: input.attachment_type ?? null,
    attached_order_id: input.attached_order_id ?? null,
    attached_product_id: input.attached_product_id ?? null,
  }
}

/**
 * Memperkaya pesan chat baru dengan kartu order/produk jika sebelumnya telah terlampir pada konteks percakapan.
 */
export function enrichIncomingMessage(
  newMsg: SupportMessageItem,
  existingMessages: SupportMessageItem[],
): SupportMessageItem {
  const enriched: SupportMessageItem = { ...newMsg }
  const prev = existingMessages.find((m) => m.attached_order || m.attached_product)

  if (
    (newMsg.attachment_type === 'order_card' || newMsg.message_text.includes('Pesanan')) &&
    !enriched.attached_order &&
    prev?.attached_order
  ) {
    enriched.attached_order = prev.attached_order
  } else if (
    (newMsg.attachment_type === 'product_card' || newMsg.message_text.includes('Produk')) &&
    !enriched.attached_product &&
    prev?.attached_product
  ) {
    enriched.attached_product = prev.attached_product
  }

  return enriched
}

/**
 * Mengekstrak pesan kesalahan dari respons API atau exception error.
 */
export function extractErrorMessage(err: unknown, fallbackMessage: string): string {
  if (!err) return fallbackMessage
  const obj = err as { data?: { message?: string }; message?: string }
  return obj?.data?.message || obj?.message || fallbackMessage
}
