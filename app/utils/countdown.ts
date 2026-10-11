export interface CountdownTime {
  hours: string
  minutes: string
  seconds: string
  totalSeconds: number
  formatted: string
}

export function formatTwoDigits(val: number): string {
  return String(Math.max(0, Math.floor(val))).padStart(2, '0')
}

/**
 * Menghitung sisa waktu hingga target tanggal promo tertentu.
 * Hanya mengembalikan CountdownTime jika targetDate valid dan berada di masa depan.
 * Mengembalikan null jika waktu promo tidak ditentukan atau sudah lewat.
 */
export function calculateCountdownUntil(
  targetDate: Date | string | null | undefined,
  now: Date = new Date(),
): CountdownTime | null {
  if (!targetDate) return null

  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  if (isNaN(target.getTime())) return null

  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return null

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hStr = formatTwoDigits(hours)
  const mStr = formatTwoDigits(minutes)
  const sStr = formatTwoDigits(seconds)

  return {
    hours: hStr,
    minutes: mStr,
    seconds: sStr,
    totalSeconds,
    formatted: `${hStr} : ${mStr} : ${sStr}`,
  }
}

/**
 * Utility helper: Menghitung sisa waktu hingga tengah malam hari ini (24:00:00).
 */
export function calculateCountdownUntilMidnight(now: Date = new Date()): CountdownTime {
  const endOfDay = new Date(now)
  endOfDay.setHours(24, 0, 0, 0)

  const countdown = calculateCountdownUntil(endOfDay, now)
  if (countdown) return countdown

  return {
    hours: '00',
    minutes: '00',
    seconds: '00',
    totalSeconds: 0,
    formatted: '00 : 00 : 00',
  }
}
