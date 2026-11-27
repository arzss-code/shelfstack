export interface CalendarCell {
  iso: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

export const ID_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const ID_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

export const ID_WEEKDAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const

export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDateParts(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (month < 0 || month > 11 || day < 1 || day > 31) return null
  return { year, month, day }
}

export function formatIsoShortId(iso: string, includeYear = true): string {
  const parts = parseIsoDateParts(iso)
  if (!parts) return iso
  const monthName = ID_MONTH_SHORT[parts.month] || ''
  return includeYear ? `${parts.day} ${monthName} ${parts.year}` : `${parts.day} ${monthName}`
}

export function buildMonthGrid(year: number, month: number, todayIso: string): CalendarCell[] {
  const firstDay = new Date(year, month, 1)
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - mondayBasedOffset)

  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    )
    const iso = toLocalIsoDate(cellDate)
    cells.push({
      iso,
      day: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month && cellDate.getFullYear() === year,
      isToday: iso === todayIso,
    })
  }
  return cells
}

export function getCalendarYearOptions(
  anchorYear: number,
  pastYears = 5,
  futureYears = 2,
): number[] {
  const minYear = Math.min(anchorYear - 1, new Date().getFullYear() - pastYears)
  const maxYear = Math.max(anchorYear + 1, new Date().getFullYear() + futureYears)
  const years: number[] = []
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y)
  }
  return years
}

export function getPresetDateRange(
  preset: 'today' | 'last7' | 'last30' | 'thisMonth',
  now: Date = new Date(),
): { from: string; to: string } {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = toLocalIsoDate(end)

  if (preset === 'today') {
    return { from: to, to }
  }
  if (preset === 'last7') {
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6)
    return { from: toLocalIsoDate(start), to }
  }
  if (preset === 'last30') {
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29)
    return { from: toLocalIsoDate(start), to }
  }
  const monthStart = new Date(end.getFullYear(), end.getMonth(), 1)
  return { from: toLocalIsoDate(monthStart), to }
}
