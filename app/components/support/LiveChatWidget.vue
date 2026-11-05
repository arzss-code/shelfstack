<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useSupportChat } from '~/composables/useSupportChat'
import LiveChatWindow from './LiveChatWindow.vue'

interface Props {
  unreadCount?: number
  isAuthenticated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unreadCount: undefined,
  isAuthenticated: undefined,
})

let auth: ReturnType<typeof useAuth> | null = null
try {
  auth = useAuth()
} catch {
  // Graceful fallback for isolated unit tests
}

let supportChat: ReturnType<typeof useSupportChat> | null = null
try {
  supportChat = useSupportChat()
} catch {
  // Graceful fallback for isolated unit tests
}

const internalIsOpen = ref(false)

const effectiveIsAuthenticated = computed(() => {
  if (props.isAuthenticated !== undefined) return props.isAuthenticated
  return auth?.isLoggedIn.value ?? false
})

const effectiveUnreadCount = computed(() => {
  if (props.unreadCount !== undefined) return props.unreadCount
  return supportChat?.unreadCount.value ?? 0
})

const isChatOpen = computed({
  get: () => {
    if (props.unreadCount !== undefined || props.isAuthenticated !== undefined) {
      return internalIsOpen.value
    }
    return supportChat?.isOpen.value ?? internalIsOpen.value
  },
  set: (val: boolean) => {
    internalIsOpen.value = val
    if (supportChat && supportChat.isOpen.value !== val) {
      supportChat.toggleChat(val)
    }
  },
})

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value
}

const closeChat = () => {
  isChatOpen.value = false
}
</script>

<template>
  <div class="live-chat-widget-root">
    <!-- Floating Action Button Launcher -->
    <button
      type="button"
      class="floating-launcher fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-ink text-white shadow-floating transition-all duration-200 hover:bg-brand-inkhover active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
      :class="[
        effectiveUnreadCount > 0 ? 'has-unread pulse-indicator' : '',
        isChatOpen ? 'rotate-90' : '',
      ]"
      :aria-label="isChatOpen ? 'Tutup Live Chat Bantuan' : 'Buka Live Chat Bantuan'"
      :aria-expanded="isChatOpen"
      aria-haspopup="dialog"
      @click="toggleChat"
    >
      <i
        :class="[
          'pi text-xl transition-transform duration-200',
          isChatOpen ? 'pi-times' : 'pi-comments',
        ]"
        aria-hidden="true"
      />

      <!-- Reactive Unread Counter Badge -->
      <span
        v-if="effectiveUnreadCount > 0"
        class="unread-badge absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm"
        aria-live="polite"
      >
        {{ effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount }}
      </span>

      <!-- Pulse animation ring when unread > 0 -->
      <span
        v-if="effectiveUnreadCount > 0"
        class="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-brand-ink opacity-25"
        aria-hidden="true"
      />
    </button>

    <!-- Popover Chat Window -->
    <LiveChatWindow
      v-if="isChatOpen"
      :is-authenticated="effectiveIsAuthenticated"
      :unread-count="effectiveUnreadCount"
      @close="closeChat"
    />
  </div>
</template>
