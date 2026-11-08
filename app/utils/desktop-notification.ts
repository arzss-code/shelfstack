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

export function showDesktopNotification(
  title: string,
  message: string,
  url?: string | null,
  tag?: string,
): void {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      const n = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag,
      })
      n.onclick = () => {
        window.focus()
        if (url) {
          navigateTo(url)
        }
      }
    } catch {
      // Browser background restriction
    }
  }
}
