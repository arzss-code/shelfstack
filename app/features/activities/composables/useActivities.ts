export function useActivities() {
  const supabase = useSupabaseClient<any>()
  const activities = ref<any[]>([])
  const loading = ref(false)
  let channel: any = null

  const fetchActivities = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      activities.value = data || []
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
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          // Add temporary 'isNew' flag for UI highlighting
          const newActivity: any = { ...payload.new, isNew: true }
          activities.value.unshift(newActivity)

          // Remove highlight flag after 2 seconds
          setTimeout(() => {
            const index = activities.value.findIndex((a) => a.id === newActivity.id)
            if (index !== -1) {
              activities.value[index].isNew = false
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
