<script setup lang="ts">
import { useActivities } from '~/features/activities/composables/useActivities'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ActivityDetailDialog from '~/features/activities/components/ActivityDetailDialog.vue'

useSeoMeta({
  title: 'Activity Log',
})

const { activities, loading, fetchActivities, subscribeToRealtime } = useActivities()
const isDialogVisible = ref(false)
const selectedActivity = ref<any>(null)

onMounted(() => {
  fetchActivities()
  subscribeToRealtime()
})

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id })
}

const getActionSeverity = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'info'
    case 'DELETE':
      return 'danger'
    case 'RESTORE':
      return 'warn'
    default:
      return 'secondary'
  }
}

const viewDetails = (activity: any) => {
  selectedActivity.value = activity
  isDialogVisible.value = true
}

const rowClass = (data: any) => {
  return [{ 'bg-emerald-50 dark:bg-emerald-900/20 transition-colors duration-1000': data.isNew }]
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1
          class="m-0 mb-1 flex items-center gap-3 text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-0"
        >
          Activity Log
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </h1>
        <p class="m-0 text-surface-500 dark:text-surface-400">
          Riwayat lengkap aktivitas dan perubahan sistem.
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && activities.length === 0"
      class="flex flex-col items-center justify-center py-20 px-8 bg-surface-0 dark:bg-surface-900 rounded-xl border border-dashed border-surface-200 dark:border-surface-800 shadow-sm"
    >
      <div
        class="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-6"
      >
        <i class="pi pi-history text-2xl text-surface-400 dark:text-surface-500" />
      </div>
      <h3 class="m-0 mb-2 text-surface-900 dark:text-surface-0 font-semibold text-lg">
        Belum ada aktivitas
      </h3>
      <p
        class="m-0 text-surface-500 dark:text-surface-400 text-sm max-w-md text-center leading-relaxed"
      >
        Sistem belum mencatat aktivitas apa pun. Lakukan aksi pada produk untuk melihat jejak rekam
        di sini.
      </p>
    </div>

    <!-- Skeleton Loading (Shimmer) -->
    <DataTable
      v-else-if="loading"
      :value="Array(5).fill({})"
      striped-rows
      class="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden"
    >
      <Column header="Waktu" style="min-width: 180px">
        <template #body>
          <Skeleton width="120px" height="1rem" />
        </template>
      </Column>
      <Column header="Aksi">
        <template #body>
          <Skeleton width="60px" height="1.5rem" border-radius="16px" />
        </template>
      </Column>
      <Column header="Deskripsi" style="min-width: 250px">
        <template #body>
          <Skeleton width="100%" height="1rem" />
        </template>
      </Column>
      <Column header="IP Address">
        <template #body>
          <Skeleton width="100px" height="1rem" />
        </template>
      </Column>
      <Column header="Browser / OS">
        <template #body>
          <Skeleton width="120px" height="1rem" />
        </template>
      </Column>
      <Column header="Detail" style="width: 100px; text-align: center">
        <template #body>
          <Skeleton shape="circle" size="2rem" class="mx-auto" />
        </template>
      </Column>
    </DataTable>

    <!-- Data Table -->
    <DataTable
      v-else
      :value="activities"
      :row-class="rowClass"
      striped-rows
      class="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden"
    >
      <Column field="created_at" header="Waktu" style="min-width: 180px">
        <template #body="{ data }">
          <span class="text-sm font-medium">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>
      <Column field="action" header="Aksi">
        <template #body="{ data }">
          <Tag
            :severity="getActionSeverity(data.action)"
            :value="data.action"
            class="text-xs tracking-wider"
          />
        </template>
      </Column>
      <Column field="description" header="Deskripsi" style="min-width: 250px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.description }}</span>
        </template>
      </Column>
      <Column field="ip_address" header="IP Address" />
      <Column field="browser" header="Browser / OS">
        <template #body="{ data }">
          <span class="text-xs text-surface-500 dark:text-surface-400"
            >{{ data.browser }} • {{ data.platform }}</span
          >
        </template>
      </Column>
      <Column header="Detail" style="width: 100px; text-align: center">
        <template #body="{ data }">
          <Button
            v-if="data.old_data || data.new_data"
            icon="pi pi-search"
            text
            rounded
            aria-label="View Details"
            @click="viewDetails(data)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Detail Dialog Component -->
    <ActivityDetailDialog v-model:visible="isDialogVisible" :activity="selectedActivity" />
  </div>
</template>
