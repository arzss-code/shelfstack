import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export interface ActivityLog {
  id: string
  action: Database['public']['Enums']['activity_action']
  browser: string | null
  created_at: string | null
  description: string
  entity_id: number
  entity_type: string
  ip_address: string | null
  new_data: Record<string, unknown> | null
  old_data: Record<string, unknown> | null
  platform: string | null
  isNew?: boolean
}

export function useActivities() {
  const supabase: SupabaseClient<Database> = useSupabaseClient<Database>()
  const activities = ref<ActivityLog[]>([])
  const loading = ref(false)
  let channel: RealtimeChannel | null = null

  const fetchActivities = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      activities.value = (data || []) as ActivityLog[]
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const subscribeToRealtime = () => {
    channel = supabase
      .channel('public:activity_logs')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload: { new: Record<string, unknown> }) => {
          // Add temporary 'isNew' flag for UI highlighting
          const newActivity: ActivityLog = {
            ...(payload.new as unknown as ActivityLog),
            isNew: true,
          }
          activities.value.unshift(newActivity)

          // Remove highlight flag after 2 seconds
          setTimeout(() => {
            const index = activities.value.findIndex((a) => a.id === newActivity.id)
            if (index !== -1 && activities.value[index]) {
              activities.value[index]!.isNew = false
            }
          }, 2000)
        },
      )
      .subscribe()
  }

  const unsubscribeFromRealtime = () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  onUnmounted(() => {
    unsubscribeFromRealtime()
  })

  return {
    activities,
    loading,
    fetchActivities,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  }
}
