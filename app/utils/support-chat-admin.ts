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
