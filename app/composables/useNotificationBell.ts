import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { NotificationItem, NotificationType } from '~~/shared/schemas/notification'
import { useNotificationStore } from '~/features/notifications/stores/notifications'

export function useNotificationBell() {
  const notificationStore = useNotificationStore()
  const { items, unreadCount, isLoading, isLoadingMore, hasMore, isOpen, desktopPermission } =
    storeToRefs(notificationStore)

  const activeTab = ref<'all' | 'unread'>('all')
  const bellRef = ref<HTMLElement | null>(null)

  const filteredItems = computed<NotificationItem[]>(() => {
    if (activeTab.value === 'unread') {
      return items.value.filter((item: NotificationItem) => !item.is_read)
    }
    return items.value
  })

  const toggleDropdown = () => {
    if (!isOpen.value) {
      notificationStore.fetchNotifications(false)
    }
    notificationStore.toggleDropdown()
  }

  const closeDropdown = () => {
    notificationStore.closeDropdown()
  }

  const handleRequestDesktop = async () => {
    await notificationStore.requestDesktopPermission()
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await notificationStore.markAsRead(item.id)
    }
    closeDropdown()
    if (item.reference_url) {
      await navigateTo(item.reference_url)
    }
  }

  const getTypeIcon = (type: NotificationType): string => {
    switch (type) {
      case 'order_created':
        return 'pi pi-shopping-bag'
      case 'payment_success':
        return 'pi pi-check-circle'
      case 'order_shipped':
        return 'pi pi-truck'
      case 'order_completed':
        return 'pi pi-verified'
      case 'order_cancelled':
        return 'pi pi-times-circle'
      case 'system':
      default:
        return 'pi pi-info-circle'
    }
  }

  const getTypeStyles = (type: NotificationType): string => {
    switch (type) {
      case 'order_created':
        return 'bg-blue-100/70 text-blue-700'
      case 'payment_success':
        return 'bg-emerald-100/70 text-emerald-700'
      case 'order_shipped':
        return 'bg-amber-100/70 text-amber-700'
      case 'order_completed':
        return 'bg-purple-100/70 text-purple-700'
      case 'order_cancelled':
        return 'bg-rose-100/70 text-rose-700'
      case 'system':
      default:
        return 'bg-zinc-100 text-zinc-700'
    }
  }

  const formatTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const diffSec = Math.floor(diffMs / 1000)
      if (diffSec < 60) return 'Baru saja'

      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin} mnt lalu`

      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return `${diffHour} jam lalu`

      const diffDay = Math.floor(diffHour / 24)
      if (diffDay < 7) return `${diffDay} hr lalu`

      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (!isOpen.value) return
    const target = event.target as Node | null
    if (bellRef.value && target && !bellRef.value.contains(target)) {
      closeDropdown()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen.value) {
      closeDropdown()
    }
  }

  onMounted(async () => {
    if (import.meta.client) {
      document.addEventListener('pointerdown', handleClickOutside, { passive: true })
      document.addEventListener('keydown', handleKeydown)
      if (items.value.length === 0) {
        await notificationStore.fetchNotifications(true)
      }
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  return {
    notificationStore,
    items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isOpen,
    desktopPermission,
    activeTab,
    bellRef,
    filteredItems,
    toggleDropdown,
    closeDropdown,
    handleRequestDesktop,
    handleNotificationClick,
    getTypeIcon,
    getTypeStyles,
    formatTime,
  }
}
