/**
 * Helper utilitas Web Notification API untuk desktop announcements.
 */

export type DesktopPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported'

export function getDesktopNotificationPermission(): DesktopPermissionStatus {
  if (import.meta.client && typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission
  }
  return 'unsupported'
}

export async function requestDesktopNotificationPermission(): Promise<DesktopPermissionStatus> {
  if (import.meta.client && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      return await Notification.requestPermission()
    } catch {
      return Notification.permission
    }
  }
  return 'unsupported'
}

function sanitizeNotificationUrl(url?: string | null): string | null {
  if (typeof url !== 'string') {
    return null
  }
  const trimmed = url.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return null
  }
  return trimmed
}

export async function showDesktopNotification(
  title: string,
  message: string,
  url?: string | null,
  tag?: string,
): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  const safeUrl = sanitizeNotificationUrl(url)
  const notificationOptions: NotificationOptions = {
    body: message,
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
    tag,
    data: safeUrl ? { url: safeUrl } : undefined,
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
    try {
      let registration =
        typeof navigator.serviceWorker.getRegistration === 'function'
          ? await navigator.serviceWorker.getRegistration('/sw.js')
          : undefined

      if (!registration && navigator.serviceWorker.controller && navigator.serviceWorker.ready) {
        registration = await navigator.serviceWorker.ready
      }

      if (registration && typeof registration.showNotification === 'function') {
        const hasActiveWorker = !('active' in registration) || Boolean(registration.active)
        if (hasActiveWorker) {
          await registration.showNotification(title, notificationOptions)
          return
        }
      }
    } catch {
      // Fallback to Window Notification API when Service Worker showNotification is unavailable
    }
  }

  try {
    const notification = new Notification(title, {
      body: message,
      icon: '/apple-touch-icon.png',
      tag,
    })
    notification.onclick = () => {
      window.focus()
      if (safeUrl) {
        void navigateTo(safeUrl)
      }
    }
  } catch {
    // Browser background restriction
  }
}
