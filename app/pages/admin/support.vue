<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminSupportInboxList from '~/components/admin/support/AdminSupportInboxList.vue'
import AdminSupportChatPane from '~/components/admin/support/AdminSupportChatPane.vue'
import AdminContactInboxPanel from '~/components/admin/support/AdminContactInboxPanel.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import { useAdminSupportChat } from '~/composables/useAdminSupportChat'
import type { SupportThreadStatus } from '~~/shared/schemas/support-chat'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Bantuan & Live Chat - Admin ShelfStack',
  description: 'Pusat layanan percakapan langsung dan resolusi kendala pelanggan secara real-time.',
})

const route = useRoute()
const router = useRouter()

const activeChannel = ref(route.query.channel === 'contact' ? 'contact_inbox' : 'live_chat')
const channelTabs = [
  { value: 'live_chat', label: 'Live Chat Pelanggan' },
  { value: 'contact_inbox', label: 'Pesan Kontak (/contact)' },
]

const {
  threads,
  activeThreadId,
  activeThread,
  messages,
  activeFilter,
  searchQuery,
  isLoadingThreads,
  error,
  fetchThreads,
  selectThread,
  sendAdminMessage,
  updateStatus,
} = useAdminSupportChat()

const totalUnreadCount = computed(() => {
  return threads.value.reduce((acc, t) => acc + (t.unread_by_admin_count || 0), 0)
})

const onSelectThread = async (threadId: string) => {
  await selectThread(threadId)
  router.replace({
    query: {
      ...route.query,
      thread: threadId,
    },
  })
}

const onBackToInbox = () => {
  activeThreadId.value = null
  const query = { ...route.query }
  delete query.thread
  router.replace({ query })
}

const onUpdateFilter = async (status: string) => {
  activeFilter.value = status
  await fetchThreads({ status, search: searchQuery.value })
}

const onUpdateSearch = async (search: string) => {
  searchQuery.value = search
  await fetchThreads({ status: activeFilter.value, search })
}

const onSendMessage = async (payload: { message_text: string; attachment_url?: string }) => {
  await sendAdminMessage(payload)
}

const onUpdateStatus = async (status: string) => {
  await updateStatus(status as SupportThreadStatus)
}

const refreshData = async () => {
  await fetchThreads()
  if (activeThreadId.value) {
    await selectThread(activeThreadId.value)
  }
}

onMounted(async () => {
  await fetchThreads()

  // Deep linking: auto-select thread from route query param if present
  if (route.query.thread && typeof route.query.thread === 'string') {
    const threadId = route.query.thread
    const exists = threads.value.some((t) => t.id === threadId)
    if (exists) {
      await selectThread(threadId)
    }
  }
})
</script>

<template>
  <div class="space-y-4 text-brand-ink">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-brand-ink flex items-center gap-2">
          <span>Bantuan & Live Chat</span>
          <span
            v-if="totalUnreadCount > 0"
            class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
          >
            {{ totalUnreadCount }} belum dibalas
          </span>
        </h1>
        <p class="text-xs text-brand-muted">
          Pusat layanan percakapan langsung dan resolusi kendala pelanggan secara real-time.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton size="sm" variant="outline" :loading="isLoadingThreads" @click="refreshData">
          <i class="pi pi-refresh text-xs" />
          <span class="hidden sm:inline">Segarkan</span>
        </UiButton>
      </div>
    </div>

    <!-- Error Banner -->
    <UiAlert v-if="error && activeChannel === 'live_chat'" tone="danger" class="text-xs">
      {{ error }}
    </UiAlert>

    <UiTabs
      v-model="activeChannel"
      :items="channelTabs"
      aria-label="Kanal layanan bantuan pelanggan"
    />

    <AdminContactInboxPanel v-if="activeChannel === 'contact_inbox'" />

    <!-- Workspace Dual-Pane Container -->
    <div
      v-else
      class="h-[calc(100vh-14rem)] min-h-[580px] flex rounded-card border border-brand-hair bg-brand-canvas shadow-whisper overflow-hidden"
    >
      <!-- Left Pane: Thread Inbox List -->
      <aside
        class="w-full md:w-80 lg:w-96 shrink-0 border-r border-brand-hair flex flex-col h-full bg-brand-canvas"
        :class="activeThreadId ? 'hidden md:flex' : 'flex'"
      >
        <AdminSupportInboxList
          :threads="threads"
          :active-thread-id="activeThreadId"
          :filter-status="activeFilter"
          :search-query="searchQuery"
          @select-thread="onSelectThread"
          @update-filter="onUpdateFilter"
          @update-search="onUpdateSearch"
        />
      </aside>

      <!-- Right Pane: Active Chat Pane or Empty State -->
      <section
        class="flex-1 min-w-0 flex flex-col h-full bg-brand-canvas"
        :class="activeThreadId ? 'flex' : 'hidden md:flex'"
      >
        <!-- Mobile Navigation Header: Back to Inbox -->
        <div
          v-if="activeThreadId"
          class="flex items-center gap-2 px-3 py-2 border-b border-brand-hair bg-brand-canvas-soft md:hidden shrink-0"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:text-brand-accent p-1 cursor-pointer"
            @click="onBackToInbox"
          >
            <i class="pi pi-arrow-left text-xs" />
            <span>Kembali ke Daftar Percakapan</span>
          </button>
        </div>

        <AdminSupportChatPane
          :thread="activeThread"
          :messages="messages"
          @send-message="onSendMessage"
          @update-status="onUpdateStatus"
        />
      </section>
    </div>
  </div>
</template>
