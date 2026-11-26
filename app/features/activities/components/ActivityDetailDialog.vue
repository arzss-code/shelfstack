<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '~/utils/format'
import type { ActivityLog } from '~/features/activities/composables/useActivities'
import type { Json } from '~/types/database.types'

const props = defineProps<{
  activity: ActivityLog | null
}>()

const visible = defineModel<boolean>('visible', { default: false })

const formatDate = (dateStr: string | null) => formatDateTime(dateStr)

const formatValue = (val: Json | undefined) => {
  if (val === null || val === undefined || val === '') return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const selectedActivityChanges = computed(() => {
  if (!props.activity) return []
  const o = (props.activity.old_data || {}) as Record<string, Json | undefined>
  const n = (props.activity.new_data || {}) as Record<string, Json | undefined>
  const keys = Array.from(new Set([...Object.keys(o), ...Object.keys(n)]))

  return keys.map((key) => {
    return {
      field: key,
      before: formatValue(o[key]),
      after: formatValue(n[key]),
    }
  })
})

const contextItems = computed(() => {
  if (!props.activity) return []
  const act = props.activity
  return [
    { key: 'Time', value: formatDate(act.created_at) },
    { key: 'Action', value: act.action },
    { key: 'Resource', value: act.entity_type },
    { key: 'IP Address', value: act.ip_address || '-' },
    { key: 'Browser', value: act.browser || '-' },
    { key: 'Platform', value: act.platform || '-' },
  ]
})
</script>

<template>
  <ClientOnly>
    <UiModal v-model:visible="visible" size="lg" title="View Admin Activity Log">
      <!-- Custom Header mimicking breadcrumbs. UiModal tetap merender satu tombol tutup di kanan header. -->
      <template #header>
        <div class="flex flex-col gap-1.5">
          <div
            class="flex items-center text-[11px] font-medium uppercase tracking-[0.05em] text-brand-muted"
          >
            <span class="hover:text-brand-ink transition-colors cursor-pointer"
              >Admin Activity Log</span
            >
            <i class="pi pi-angle-right text-[9px] mx-2" />
            <span class="text-brand-faint">View</span>
          </div>
          <h2 class="m-0 text-xl font-bold tracking-tight text-brand-ink">
            View Admin Activity Log
          </h2>
        </div>
      </template>

      <div v-if="activity" class="flex flex-col gap-6 text-[13px]">
        <!-- Context Card -->
        <div
          class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft shadow-whisper"
        >
          <div class="border-b border-brand-hair bg-brand-canvas/60 px-4 py-3">
            <h3 class="m-0 text-sm font-bold tracking-tight text-brand-ink">Context</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
                >
                  <th class="py-3 px-4 font-semibold w-1/3 whitespace-nowrap">Key</th>
                  <th class="py-3 px-4 font-semibold w-2/3">Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-hairsoft">
                <tr
                  v-for="(item, index) in contextItems"
                  :key="index"
                  class="hover:bg-brand-canvas transition-colors"
                >
                  <td class="py-3.5 px-4 font-medium text-brand-ink whitespace-nowrap">
                    {{ item.key }}
                  </td>
                  <td class="py-3.5 px-4 text-brand-muted">
                    <span class="block max-w-md truncate" :title="item.value">
                      {{ item.value }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Changes Card -->
        <div
          class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft shadow-whisper"
        >
          <div class="border-b border-brand-hair bg-brand-canvas/60 px-4 py-3">
            <h3 class="m-0 text-sm font-bold tracking-tight text-brand-ink">Changes</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
                >
                  <th class="py-3 px-4 font-semibold w-1/4 whitespace-nowrap">Field</th>
                  <th class="py-3 px-4 font-semibold w-3/8">Before</th>
                  <th class="py-3 px-4 font-semibold w-3/8">After</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-hairsoft">
                <tr v-if="selectedActivityChanges.length === 0">
                  <td colspan="3" class="py-8 px-4 text-center text-brand-faint">
                    Tidak ada perubahan field tercatat (Payload kosong).
                  </td>
                </tr>
                <template v-else>
                  <tr
                    v-for="(change, index) in selectedActivityChanges"
                    :key="index"
                    class="hover:bg-brand-canvas transition-colors"
                  >
                    <td class="py-3.5 px-4 font-medium text-brand-ink whitespace-nowrap">
                      {{ change.field }}
                    </td>
                    <td
                      class="py-3.5 px-4 font-mono text-brand-danger-text max-w-[220px] truncate"
                      :title="change.before"
                    >
                      {{ change.before }}
                    </td>
                    <td
                      class="py-3.5 px-4 font-mono text-brand-success-text max-w-[220px] truncate"
                      :title="change.after"
                    >
                      {{ change.after }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UiModal>
  </ClientOnly>
</template>
