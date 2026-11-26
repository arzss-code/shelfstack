<script setup lang="ts">
import { useActivities } from '~/features/activities/composables/useActivities'
import type { ActivityLog } from '~/features/activities/composables/useActivities'
import {
  ACTIVITY_ACTIONS,
  NO_FILTER,
  distinctEntityTypes,
  filterActivities,
  isFiltering,
} from '~/features/activities/utils/activity-filter'
import { formatDateTime } from '~/utils/format'
import ActivityDetailDialog from '~/features/activities/components/ActivityDetailDialog.vue'

useSeoMeta({
  title: 'Activity Log',
})

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { activities, loading, fetchActivities, subscribeToRealtime } = useActivities()
const isDialogVisible = ref(false)
const selectedActivity = ref<ActivityLog | null>(null)
const selectedEntity = ref(NO_FILTER.entity)
const selectedAction = ref(NO_FILTER.action)

const entityOptions = computed(() => distinctEntityTypes(activities.value))
const entitySelectOptions = computed(() => [
  { value: '', label: 'Semua entitas' },
  ...entityOptions.value.map((entity) => ({ value: entity, label: entity })),
])

const actionTabs = computed(() => [
  { value: NO_FILTER.action, label: 'Semua' },
  ...ACTIVITY_ACTIONS.map((action) => ({ value: action, label: action })),
])

const filteredActivities = computed(() =>
  filterActivities(activities.value, {
    entity: selectedEntity.value,
    action: selectedAction.value,
  }),
)

const filteringActive = computed(() =>
  isFiltering({ entity: selectedEntity.value, action: selectedAction.value }),
)

const resetFilters = () => {
  selectedEntity.value = NO_FILTER.entity
  selectedAction.value = NO_FILTER.action
}

onMounted(() => {
  fetchActivities()
  subscribeToRealtime()
})

/** Waktu bisa null bila kolom kosong, tampilkan placeholder ringkas. */
const formatDate = (dateStr: string | null) => formatDateTime(dateStr)

const getActionVariant = (
  action: string,
): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (action) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'info'
    case 'DELETE':
      return 'danger'
    case 'RESTORE':
      return 'warning'
    default:
      return 'default'
  }
}

const viewDetails = (activity: ActivityLog) => {
  selectedActivity.value = activity
  isDialogVisible.value = true
}

/** Baris baru dari realtime memakai tint sukses selama 2 detik, lalu composable menurunkan flag. */
const rowClass = (data: ActivityLog) =>
  data.isNew ? 'bg-brand-success-tint transition-colors duration-1000' : ''
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="m-0 mb-1 text-3xl font-bold tracking-tight text-brand-ink">Activity Log</h1>
        <p class="m-0 text-brand-muted">Riwayat lengkap aktivitas dan perubahan sistem.</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="mb-4 flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-4 md:flex-row md:items-center md:justify-between"
    >
      <UiTabs v-model="selectedAction" :items="actionTabs" aria-label="Filter jenis aksi" />

      <div class="flex items-center gap-2">
        <span v-if="!loading" class="text-xs text-brand-muted">
          Menampilkan {{ filteredActivities.length }} dari {{ activities.length }}
        </span>
        <label for="activity-entity-filter" class="sr-only">Filter entitas</label>
        <UiSelect
          id="activity-entity-filter"
          v-model="selectedEntity"
          :options="entitySelectOptions"
          size="sm"
          aria-label="Filter entitas"
          class="max-w-[190px]"
        />
        <UiButton v-if="filteringActive" variant="ghost" size="sm" @click="resetFilters">
          Reset
        </UiButton>
      </div>
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-if="!loading && filteredActivities.length === 0"
      icon="pi-history"
      :title="filteringActive ? 'Tidak ada hasil' : 'Belum ada aktivitas'"
      :description="
        filteringActive
          ? 'Tidak ada aktivitas yang cocok dengan filter. Ubah filter atau reset untuk melihat semua.'
          : 'Sistem belum mencatat aktivitas apa pun. Lakukan aksi pada produk untuk melihat jejak rekam di sini.'
      "
      :action-label="filteringActive ? 'Tampilkan semua' : ''"
      @action="resetFilters"
    />

    <!-- Tabel aktivitas: shimmer saat memuat, data setelahnya -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft shadow-whisper"
    >
      <!-- Skeleton Loading (Shimmer) -->
      <div v-if="loading" class="space-y-3 p-4" aria-busy="true">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4">
          <UiSkeleton width="w-44" height="h-4" />
          <UiSkeleton width="w-20" height="h-6" shape="pill" />
          <div class="min-w-0 flex-1">
            <UiSkeleton width="w-full" height="h-4" />
          </div>
          <UiSkeleton width="w-24" height="h-4" />
          <UiSkeleton width="w-32" height="h-4" />
          <UiSkeleton width="w-7" height="h-7" shape="pill" />
        </div>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th class="py-3 px-4 font-semibold whitespace-nowrap w-[180px]">Waktu</th>
              <th class="py-3 px-4 font-semibold">Aksi</th>
              <th class="py-3 px-4 font-semibold min-w-[250px]">Deskripsi</th>
              <th class="py-3 px-4 font-semibold whitespace-nowrap">IP Address</th>
              <th class="py-3 px-4 font-semibold whitespace-nowrap">Browser / OS</th>
              <th class="py-3 px-4 font-semibold text-center w-[100px]">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="row in filteredActivities"
              :key="row.id"
              class="hover:bg-brand-canvas transition-colors"
              :class="rowClass(row)"
            >
              <td class="py-3.5 px-4 font-medium text-brand-ink whitespace-nowrap">
                {{ formatDate(row.created_at) }}
              </td>
              <td class="py-3.5 px-4">
                <UiBadge :label="row.action" :variant="getActionVariant(row.action)" />
              </td>
              <td class="py-3.5 px-4 text-brand-ink">{{ row.description }}</td>
              <td class="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                {{ row.ip_address || '-' }}
              </td>
              <td class="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                {{ row.browser || '-' }} • {{ row.platform || '-' }}
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <UiTooltip v-if="row.old_data || row.new_data" text="Lihat Detail" position="top">
                  <UiIconButton icon="pi-search" label="Lihat Detail" @click="viewDetails(row)" />
                </UiTooltip>
                <span v-else class="text-brand-faint">Tidak ada</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Dialog Component -->
    <ActivityDetailDialog v-model:visible="isDialogVisible" :activity="selectedActivity" />
  </div>
</template>
