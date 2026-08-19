export function useActivityLog() {
  const logActivity = async (params: {
    entity_type: string
    entity_id: number
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
    description: string
    old_data?: any
    new_data?: any
  }) => {
    try {
      await $fetch('/api/activities', {
        method: 'POST',
        body: params,
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
      // We don't want to throw and break the main application flow just because a log failed.
    }
  }

  return { logActivity }
}
