<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiIconButton from '~/components/ui/UiIconButton.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'
import UiSortHeader from '~/components/ui/UiSortHeader.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'
import { useClientPagination } from '~/composables/useClientPagination'
import { useClientTableSort } from '~/composables/useClientTableSort'
import type { ActivityLog } from '~/features/activities/composables/useActivities'
import {
  formatActivityAgent,
  formatActivityEntityLabel,
  formatActivityIp,
} from '~/features/activities/utils/activity-filter'
import { formatDateTime } from '~/utils/format'

const props = defineProps<{
  activities: ActivityLog[]
  loading: boolean
}>()

const emit = defineEmits<{
  viewDetails: [activity: ActivityLog]
}>()

const activityColumns = [
  { key: 'created_at', label: 'Waktu', thClass: 'whitespace-nowrap w-[170px]' },
  { key: 'action', label: 'Aksi', thClass: 'whitespace-nowrap' },
  { key: 'description', label: 'Aktivitas & Entitas', thClass: 'min-w-[260px]' },
  { key: 'ip_address', label: 'IP Address', thClass: 'whitespace-nowrap' },
  { key: 'browser', label: 'Browser / OS', thClass: 'whitespace-nowrap' },
] as const

const {
  sortKey,
  sortDirection,
  sortedItems: sortedActivities,
  onSortChange,
  getAriaSort,
} = useClientTableSort(() => props.activities, {
  created_at: (row) => (row.created_at ? new Date(row.created_at).getTime() : 0),
  action: (row) => row.action,
  description: (row) => row.description,
  ip_address: (row) => formatActivityIp(row.ip_address),
  browser: (row) => formatActivityAgent(row.browser, row.platform),
})

const {
  page,
  pageSize,
  totalCount,
  totalPages,
  paginatedItems: paginatedActivities,
} = useClientPagination(sortedActivities, 10)

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

const rowClass = (data: ActivityLog) =>
  data.isNew ? 'bg-brand-success-tint transition-colors duration-1000' : ''
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <div v-if="loading" class="space-y-3 p-4" aria-busy="true">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4">
        <UiSkeleton width="w-40" height="h-4" />
        <UiSkeleton width="w-20" height="h-6" shape="pill" />
        <div class="min-w-0 flex-1">
          <UiSkeleton width="w-full" height="h-4" />
        </div>
        <UiSkeleton width="w-24" height="h-4" />
        <UiSkeleton width="w-32" height="h-4" />
        <UiSkeleton width="w-7" height="h-7" shape="pill" />
      </div>
    </div>

    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel activity log sistem"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas-soft text-brand-muted uppercase tracking-wider text-[11px]"
          >
            <th
              v-for="col in activityColumns"
              :key="col.key"
              scope="col"
              class="py-2.5 px-3.5"
              :class="col.thClass"
              :aria-sort="getAriaSort(col.key)"
            >
              <UiSortHeader
                :sort-key="col.key"
                :label="col.label"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                {{ col.label }}
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5 font-semibold text-center w-[90px]">Detail</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="row in paginatedActivities"
            :key="row.id"
            class="hover:bg-brand-canvas-soft/50 transition-colors"
            :class="rowClass(row)"
          >
            <td class="py-2.5 px-3.5 font-medium text-brand-ink whitespace-nowrap tabular">
              {{ formatDate(row.created_at) }}
            </td>
            <td class="py-2.5 px-3.5">
              <UiBadge :label="row.action" :variant="getActionVariant(row.action)" />
            </td>
            <td class="py-2.5 px-3.5 text-brand-ink">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-medium text-brand-ink">{{ row.description }}</span>
                <span
                  v-if="row.entity_type"
                  class="rounded-full border border-brand-hairsoft bg-brand-canvas-soft px-2 py-0.5 text-[10px] font-medium text-brand-muted"
                >
                  {{ formatActivityEntityLabel(row.entity_type) }}
                </span>
              </div>
            </td>
            <td class="py-2.5 px-3.5 whitespace-nowrap tabular">
              <span :class="row.ip_address ? 'text-brand-ink font-medium' : 'text-brand-faint'">
                {{ formatActivityIp(row.ip_address) }}
              </span>
            </td>
            <td class="py-2.5 px-3.5 whitespace-nowrap">
              <span :class="row.browser || row.platform ? 'text-brand-muted' : 'text-brand-faint'">
                {{ formatActivityAgent(row.browser, row.platform) }}
              </span>
            </td>
            <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
              <UiTooltip v-if="row.old_data || row.new_data" text="Lihat Detail" position="top">
                <UiIconButton
                  icon="pi-search"
                  label="Lihat Detail"
                  @click="emit('viewDetails', row)"
                />
              </UiTooltip>
              <span v-else class="text-brand-faint">Tidak ada</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-if="!loading && activities.length > 0"
      v-model="page"
      v-model:page-size="pageSize"
      :total-pages="totalPages"
      :total-count="totalCount"
      :loading="loading"
      item-name="aktivitas"
      compact
    />
  </div>
</template>
