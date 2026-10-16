import type { ActivityLog } from '../composables/useActivities'

export interface ActivityFilter {
  entity: string
  action: string
}

export const NO_FILTER: ActivityFilter = { entity: '', action: '' }

export const ACTIVITY_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'] as const

export function distinctEntityTypes(logs: ActivityLog[]): string[] {
  const seen = new Set<string>()
  for (const log of logs) {
    if (log.entity_type) {
      seen.add(log.entity_type)
    }
  }
  return [...seen].sort()
}

export function filterActivities(logs: ActivityLog[], filter: ActivityFilter): ActivityLog[] {
  return logs.filter((log) => {
    if (filter.entity && log.entity_type !== filter.entity) return false
    if (filter.action && log.action !== filter.action) return false
    return true
  })
}

export function isFiltering(filter: ActivityFilter): boolean {
  return filter.entity !== '' || filter.action !== ''
}
