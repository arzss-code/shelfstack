<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminOperationalSignals from '~/features/admin/components/AdminOperationalSignals.vue'
import AdminExpiryQueueCard from '~/features/orders/components/AdminExpiryQueueCard.vue'
import AdminActivityTable from '~/features/activities/components/AdminActivityTable.vue'
import { useActivities } from '~/features/activities/composables/useActivities'
import type { ActivityLog } from '~/features/activities/composables/useActivities'
import {
  ACTIVITY_ACTIONS,
  NO_FILTER,
  distinctEntityTypes,
  filterActivities,
  isFiltering,
} from '~/features/activities/utils/activity-filter'
import ActivityDetailDialog from '~/features/activities/components/ActivityDetailDialog.vue'

useSeoMeta({
  title: 'Aktivitas & Status Sistem - Admin ShelfStack',
})

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const activeSection = ref<'logs' | 'system'>(route.query.tab === 'system' ? 'system' : 'logs')
const sectionTabs = [
  { value: 'logs', label: 'Riwayat Aktivitas' },
  { value: 'system', label: 'Status Sistem' },
]

watch(activeSection, (val) => {
  router.replace({ query: val === 'system' ? { ...route.query, tab: 'system' } : {} })
})

const { activities, loading, fetchActivities, subscribeToRealtime } = useActivities()
const isDialogVisible = ref(false)
const selectedActivity = ref<ActivityLog | null>(null)
const selectedEntity = ref(NO_FILTER.entity)
const selectedAction = ref(NO_FILTER.action)

const entityOptions = computed(() => distinctEntityTypes(activities.value))
const entitySelectOptions = computed(() => [
  { value: 'all', label: 'Semua entitas' },
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

const viewDetails = (activity: ActivityLog) => {
  selectedActivity.value = activity
  isDialogVisible.value = true
}
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Aktivitas & Status Sistem"
      subtitle="Riwayat perubahan data admin dan kondisi layanan toko."
    >
      <template v-if="activeSection === 'logs'" #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchActivities"
        >
          Muat Ulang
        </UiButton>
      </template>
    </AdminPageHeader>

    <UiTabs
      v-model="activeSection"
      :items="sectionTabs"
      aria-label="Bagian aktivitas dan status sistem"
    />

    <div v-if="activeSection === 'system'" class="space-y-5">
      <AdminOperationalSignals />
      <AdminExpiryQueueCard />
    </div>

    <template v-else>
      <!-- Filter Bar -->
      <div
        class="flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3.5 shadow-whisper md:flex-row md:items-center md:justify-between"
      >
        <UiTabs v-model="selectedAction" :items="actionTabs" aria-label="Filter jenis aksi" />

        <div class="flex items-center gap-2">
          <span v-if="!loading" class="text-xs text-brand-muted">
            Menampilkan {{ filteredActivities.length }} dari {{ activities.length }}
          </span>
          <label for="activity-entity-filter" class="sr-only">Filter entitas</label>
          <UiSelect
            id="activity-entity-filter"
            :model-value="selectedEntity || 'all'"
            :options="entitySelectOptions"
            size="sm"
            aria-label="Filter entitas"
            class="max-w-[190px]"
            @update:model-value="selectedEntity = $event === 'all' ? '' : $event"
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
      <AdminActivityTable
        v-else
        :activities="filteredActivities"
        :loading="loading"
        @view-details="viewDetails"
      />
    </template>

    <!-- Detail Dialog Component -->
    <ActivityDetailDialog v-model:visible="isDialogVisible" :activity="selectedActivity" />
  </div>
</template>
