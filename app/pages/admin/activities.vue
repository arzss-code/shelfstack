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
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
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

const viewDetails = (activity: ActivityLog) => {
  selectedActivity.value = activity
  isDialogVisible.value = true
}

const rowClass = (data: ActivityLog) => {
  return [{ 'bg-emerald-50 dark:bg-emerald-900/20 transition-colors duration-1000': data.isNew }]
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1
          class="m-0 mb-1 flex items-center gap-3 text-3xl font-bold tracking-tight text-brand-ink"
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
        <p class="m-0 text-brand-muted">Riwayat lengkap aktivitas dan perubahan sistem.</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="mb-4 flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          :class="[
            selectedAction === ''
              ? 'bg-brand-ink text-brand-onink'
              : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink',
          ]"
          @click="selectedAction = ''"
        >
          Semua
        </button>
        <button
          v-for="action in ACTIVITY_ACTIONS"
          :key="action"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          :class="[
            selectedAction === action
              ? 'bg-brand-ink text-brand-onink'
              : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink',
          ]"
          @click="selectedAction = action"
        >
          {{ action }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="!loading" class="text-xs text-brand-muted">
          Menampilkan {{ filteredActivities.length }} dari {{ activities.length }}
        </span>
        <select
          v-model="selectedEntity"
          aria-label="Filter entitas"
          class="rounded-full border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs text-brand-ink focus:outline-none"
        >
          <option value="">Semua entitas</option>
          <option v-for="entity in entityOptions" :key="entity" :value="entity">
            {{ entity }}
          </option>
        </select>
        <UiButton v-if="filteringActive" variant="ghost" size="sm" @click="resetFilters">
          Reset
        </UiButton>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredActivities.length === 0"
      class="flex flex-col items-center justify-center py-20 px-8 bg-brand-canvas rounded-card border border-dashed border-brand-hair shadow-whisper"
    >
      <div
        class="w-16 h-16 rounded-full bg-brand-canvas-soft flex items-center justify-center mb-6"
      >
        <i class="pi pi-history text-2xl text-brand-faint" />
      </div>
      <h3 class="m-0 mb-2 text-brand-ink font-semibold text-lg">
        {{ filteringActive ? 'Tidak ada hasil' : 'Belum ada aktivitas' }}
      </h3>
      <p class="m-0 text-brand-muted text-sm max-w-md text-center leading-relaxed">
        {{
          filteringActive
            ? 'Tidak ada aktivitas yang cocok dengan filter. Ubah filter atau reset untuk melihat semua.'
            : 'Sistem belum mencatat aktivitas apa pun. Lakukan aksi pada produk untuk melihat jejak rekam di sini.'
        }}
      </p>
      <UiButton
        v-if="filteringActive"
        variant="secondary"
        size="sm"
        class="mt-4"
        @click="resetFilters"
      >
        Tampilkan semua
      </UiButton>
    </div>

    <!-- Skeleton Loading (Shimmer) -->
    <DataTable
      v-else-if="loading"
      :value="Array(5).fill({})"
      striped-rows
      class="border border-brand-hair rounded-card overflow-hidden"
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
      :value="filteredActivities"
      :row-class="rowClass"
      striped-rows
      class="border border-brand-hair rounded-card overflow-hidden"
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
          <span class="text-xs text-brand-muted">{{ data.browser }} • {{ data.platform }}</span>
        </template>
      </Column>
      <Column header="Detail" style="width: 100px; text-align: center">
        <template #body="{ data }">
          <UiTooltip v-if="data.old_data || data.new_data" text="Lihat Detail" position="top">
            <Button
              icon="pi pi-search"
              text
              rounded
              aria-label="Lihat Detail"
              @click="viewDetails(data)"
            />
          </UiTooltip>
        </template>
      </Column>
    </DataTable>

    <!-- Detail Dialog Component -->
    <ActivityDetailDialog v-model:visible="isDialogVisible" :activity="selectedActivity" />
  </div>
</template>
