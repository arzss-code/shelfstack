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
  formatActivityEntityLabel,
  isFiltering,
} from '~/features/activities/utils/activity-filter'
import ActivityDetailDialog from '~/features/activities/components/ActivityDetailDialog.vue'
import UiDateRangePicker from '~/components/ui/UiDateRangePicker.vue'

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
const searchQuery = ref('')
const fromDate = ref('')
const toDate = ref('')

const entityOptions = computed(() => distinctEntityTypes(activities.value))
const entitySelectOptions = computed(() => [
  { value: 'all', label: 'Semua Entitas' },
  ...entityOptions.value.map((entity) => ({
    value: entity,
    label: formatActivityEntityLabel(entity),
  })),
])

const actionTabs = computed(() => [
  { value: NO_FILTER.action, label: 'Semua' },
  ...ACTIVITY_ACTIONS.map((action) => ({ value: action, label: action })),
])

const currentFilter = computed(() => ({
  entity: selectedEntity.value,
  action: selectedAction.value,
  search: searchQuery.value,
  fromDate: fromDate.value,
  toDate: toDate.value,
}))

const filteredActivities = computed(() => filterActivities(activities.value, currentFilter.value))
const filteringActive = computed(() => isFiltering(currentFilter.value))

const resetFilters = () => {
  selectedEntity.value = NO_FILTER.entity
  selectedAction.value = NO_FILTER.action
  searchQuery.value = ''
  fromDate.value = ''
  toDate.value = ''
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
      <div
        data-testid="admin-activities-filter-bar"
        class="flex flex-col gap-2.5 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper"
      >
        <div class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          <UiTabs v-model="selectedAction" :items="actionTabs" aria-label="Filter jenis aksi" />

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
            <label for="activity-search-input" class="sr-only">Cari log aktivitas</label>
            <div class="w-full min-w-[180px] sm:flex-1 xl:w-56 xl:flex-none">
              <UiInput
                id="activity-search-input"
                v-model="searchQuery"
                type="search"
                size="sm"
                left-icon="pi-search"
                placeholder="Cari deskripsi, IP, order ID..."
                clearable
              />
            </div>

            <label for="activity-entity-filter" class="sr-only">Filter entitas</label>
            <UiSelect
              id="activity-entity-filter"
              :model-value="selectedEntity || 'all'"
              :options="entitySelectOptions"
              size="sm"
              pill
              aria-label="Filter entitas"
              @update:model-value="selectedEntity = $event === 'all' ? '' : $event"
            />

            <UiDateRangePicker
              v-model:from="fromDate"
              v-model:to="toDate"
              aria-label="Filter rentang tanggal log aktivitas"
            />

            <UiButton v-if="filteringActive" variant="ghost" size="sm" @click="resetFilters">
              Reset
            </UiButton>
          </div>
        </div>

        <div
          v-if="!loading && filteringActive"
          class="flex items-center justify-between border-t border-brand-hairsoft pt-2 text-[11px] text-brand-muted"
        >
          <span class="tabular">
            Hasil filter:
            <strong class="font-semibold text-brand-ink">{{ filteredActivities.length }}</strong>
            dari {{ activities.length }} log tercatat
          </span>
        </div>
      </div>

      <UiEmptyState
        v-if="!loading && filteredActivities.length === 0"
        icon="pi-history"
        :title="filteringActive ? 'Tidak ada hasil' : 'Belum ada aktivitas'"
        :description="
          filteringActive
            ? 'Tidak ada aktivitas yang cocok dengan filter. Ubah kata kunci atau reset untuk melihat semua.'
            : 'Sistem belum mencatat aktivitas apa pun. Lakukan aksi pada produk untuk melihat jejak rekam di sini.'
        "
        :action-label="filteringActive ? 'Tampilkan semua' : ''"
        @action="resetFilters"
      />

      <AdminActivityTable
        v-else
        :activities="filteredActivities"
        :loading="loading"
        @view-details="viewDetails"
      />
    </template>

    <ActivityDetailDialog v-model:visible="isDialogVisible" :activity="selectedActivity" />
  </div>
</template>
