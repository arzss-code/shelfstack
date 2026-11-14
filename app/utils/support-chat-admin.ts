import type {
  AdminSendSupportMessageInput,
  SupportMessageItem,
  SupportThreadItem,
  SupportThreadStatus,
  SupportThreadWithCustomer,
} from '~~/shared/schemas/support-chat'

export async function fetchAdminSupportThreadsApi(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  const res = await $fetch<{
    status: string
    data: { threads: SupportThreadWithCustomer[]; total: number }
  }>('/api/admin/support/threads', {
    query: {
      status: params?.status,
      search: params?.search?.trim() || undefined,
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    },
  })
  return res.data
}

export async function fetchAdminSupportMessagesApi(threadId: string) {
  const res = await $fetch<{
    status: string
    data: { thread: SupportThreadItem; messages: SupportMessageItem[] }
  }>(`/api/admin/support/threads/${threadId}/messages`)
  return res.data
}

export async function sendAdminSupportMessageApi(
  threadId: string,
  payload: AdminSendSupportMessageInput,
) {
  const res = await $fetch<{ status: string; data: { message: SupportMessageItem } }>(
    `/api/admin/support/threads/${threadId}/messages`,
    { method: 'POST', body: payload },
  )
  return res.data.message
}

export async function updateAdminSupportStatusApi(
  threadId: string,
  newStatus: SupportThreadStatus,
) {
  const res = await $fetch<{ status: string; data: { thread: SupportThreadItem } }>(
    `/api/admin/support/threads/${threadId}/status`,
    { method: 'PATCH', body: { status: newStatus } },
  )
  return res.data.thread
}

export function sortAdminThreads(threads: SupportThreadWithCustomer[]): void {
  threads.sort(
    (a, b) =>
      new Date(b.last_message_at || b.created_at).getTime() -
      new Date(a.last_message_at || a.created_at).getTime(),
  )
}

export function updateThreadFromInboxPayload(
  existing: SupportThreadWithCustomer,
  updated: SupportThreadItem,
  isActiveThread: boolean,
): void {
  Object.assign(existing, {
    last_message_text: updated.last_message_text,
    last_message_at: updated.last_message_at,
    status: updated.status,
    updated_at: updated.updated_at,
    unread_by_customer_count: updated.unread_by_customer_count,
    unread_by_admin_count: isActiveThread ? 0 : updated.unread_by_admin_count,
  })
}

export function validateAdminMessagePayload(payloadOrText: string | AdminSendSupportMessageInput): {
  payload: AdminSendSupportMessageInput
  error?: string
} {
  const payload =
    typeof payloadOrText === 'string' ? { message_text: payloadOrText } : payloadOrText
  const text = payload.message_text?.trim() || ''
  if (!text) return { payload, error: 'Balasan tidak boleh kosong.' }
  if (text.length > 1000) return { payload, error: 'Balasan maksimal 1000 karakter.' }
  return { payload }
}

export function appendAdminSentMessage(
  threads: SupportThreadWithCustomer[],
  messages: SupportMessageItem[],
  newMsg: SupportMessageItem,
  activeThreadId: string,
): void {
  if (!messages.some((m) => m.id === newMsg.id)) messages.push(newMsg)
  const current = threads.find((t) => t.id === activeThreadId)
  if (current) {
    Object.assign(current, {
      last_message_text: newMsg.message_text,
      last_message_at: newMsg.created_at,
      status: 'waiting_customer' as const,
      unread_by_admin_count: 0,
    })
  }
}

export function createAdminSupportState() {
  return {
    threads: useState<SupportThreadWithCustomer[]>('admin-support-threads', () => []),
    activeThreadId: useState<string | null>('admin-support-active-id', () => null),
    messages: useState<SupportMessageItem[]>('admin-support-messages', () => []),
    activeFilter: useState<string>('admin-support-filter', () => 'all'),
    searchQuery: useState<string>('admin-support-search', () => ''),
    isLoadingThreads: useState<boolean>('admin-support-loading-threads', () => false),
    isLoadingMessages: useState<boolean>('admin-support-loading-messages', () => false),
    isSending: useState<boolean>('admin-support-is-sending', () => false),
    error: useState<string | null>('admin-support-error', () => null),
  }
}
