import { defineStore } from 'pinia'
import type { NotificationItem } from '../../../../shared/schemas/notification'
import { useUiToast } from '~/composables/useUiToast'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isOpen = ref(false)
  let channel: any = null

  const toast = useUiToast()

  // Helper mendeteksi status login pengguna
  const checkIsLoggedIn = (): boolean => {
    try {
      const user = useSupabaseUser()
      return Boolean(user?.value)
    } catch {
      return false
    }
  }

  // Mengambil daftar notifikasi dari backend Nitro
  const fetchNotifications = async () => {
    if (!checkIsLoggedIn()) {
      items.value = []
      unreadCount.value = 0
      return
    }

    isLoading.value = true
    try {
      const res = await $fetch<{
        success: boolean
        data: {
          notifications: NotificationItem[]
          unread_count: number
        }
      }>('/api/notifications')

      if (res?.data) {
        items.value = res.data.notifications || []
        unreadCount.value = res.data.unread_count || 0
      }
    } catch (err) {
      console.error('[NotificationStore] Gagal memuat notifikasi:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Menandai satu notifikasi sebagai telah dibaca
  const markAsRead = async (id: string) => {
    const target = items.value.find((item: NotificationItem) => item.id === id)
    if (!target || target.is_read) return

    // Optimistic UI update
    target.is_read = true
    target.read_at = new Date().toISOString()
    unreadCount.value = Math.max(0, unreadCount.value - 1)

    try {
      await $fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
    } catch (err) {
      console.error('[NotificationStore] Gagal menandai notifikasi dibaca:', err)
      // Rollback jika request gagal
      target.is_read = false
      target.read_at = null
      unreadCount.value++
    }
  }

  // Menandai seluruh notifikasi sebagai telah dibaca
  const markAllAsRead = async () => {
    if (unreadCount.value === 0) return

    const previousUnread = unreadCount.value
    const previousItems: NotificationItem[] = JSON.parse(JSON.stringify(items.value))

    // Optimistic UI update
    items.value.forEach((item: NotificationItem) => {
      item.is_read = true
      item.read_at = new Date().toISOString()
    })
    unreadCount.value = 0

    try {
      await $fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
    } catch (err) {
      console.error('[NotificationStore] Gagal menandai semua notifikasi dibaca:', err)
      // Rollback jika request gagal
      items.value = previousItems
      unreadCount.value = previousUnread
    }
  }

  // Inisialisasi listener realtime Supabase Postgres Changes
  const setupRealtimeListener = (userId: string) => {
    if (!import.meta.client || !userId) return
    cleanupRealtimeListener()

    try {
      const supabase = useSupabaseClient()
      channel = supabase
        .channel(`notifications-user-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload?.new) {
              const newNotif = payload.new as NotificationItem
              // Sisipkan di posisi teratas
              items.value.unshift(newNotif)
              if (!newNotif.is_read) {
                unreadCount.value++
              }

              // Tampilkan toast feedback ringan
              let severity: 'success' | 'warn' | 'info' = 'info'
              if (newNotif.type === 'payment_success' || newNotif.type === 'order_completed') {
                severity = 'success'
              } else if (newNotif.type === 'order_cancelled') {
                severity = 'warn'
              }

              toast.add({
                summary: newNotif.title,
                detail: newNotif.message,
                severity,
              })
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload?.new) {
              const updated = payload.new as NotificationItem
              const idx = items.value.findIndex((i: NotificationItem) => i.id === updated.id)
              if (idx !== -1) {
                items.value[idx] = updated
              }
              unreadCount.value = items.value.filter((i: NotificationItem) => !i.is_read).length
            }
          },
        )
        .subscribe()
    } catch (err) {
      console.error('[NotificationStore] Gagal menginisialisasi listener realtime:', err)
    }
  }

  // Bersihkan listener realtime saat logout atau unmount
  const cleanupRealtimeListener = () => {
    if (channel) {
      try {
        const supabase = useSupabaseClient()
        supabase.removeChannel(channel)
      } catch {
        // Abaikan error saat teardown di testing
      }
      channel = null
    }
  }

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value
  }

  const closeDropdown = () => {
    isOpen.value = false
  }

  return {
    items,
    unreadCount,
    isLoading,
    isOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeListener,
    cleanupRealtimeListener,
    toggleDropdown,
    closeDropdown,
  }
})
