<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const props = defineProps<{
  activity: any | null
}>()

const visible = defineModel<boolean>('visible', { default: false })

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id })
}

const formatValue = (val: any) => {
  if (val === null || val === undefined || val === '') return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const selectedActivityChanges = computed(() => {
  if (!props.activity) return []
  const o = props.activity.old_data || {}
  const n = props.activity.new_data || {}
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
    <Dialog
      v-model:visible="visible"
      modal
      :style="{ width: '55rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <!-- Custom Header mimicking breadcrumbs -->
      <template #header>
        <div class="flex flex-col gap-1.5 pb-2">
          <div
            class="flex items-center text-[11px] font-medium uppercase tracking-[0.05em] text-zinc-500 dark:text-zinc-400"
          >
            <span
              class="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >Admin Activity Log</span
            >
            <i class="pi pi-angle-right text-[9px] mx-2" />
            <span class="text-zinc-400 dark:text-zinc-500">View</span>
          </div>
          <h2 class="m-0 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            View Admin Activity Log
          </h2>
        </div>
      </template>

      <div v-if="activity" class="flex flex-col gap-6 font-mono text-[13px] pt-2">
        <!-- Context Card -->
        <div
          class="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] overflow-hidden shadow-sm"
        >
          <div
            class="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-transparent"
          >
            <h3
              class="m-0 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight"
            >
              Context
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap border-collapse">
              <thead class="border-b border-zinc-200 dark:border-zinc-800/80">
                <tr>
                  <th
                    class="px-5 py-3 font-semibold w-1/3 text-zinc-900 dark:text-zinc-100 bg-transparent"
                  >
                    Key
                  </th>
                  <th
                    class="px-5 py-3 font-semibold w-2/3 text-zinc-900 dark:text-zinc-100 bg-transparent"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                <tr
                  v-for="(item, index) in contextItems"
                  :key="index"
                  class="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  <td
                    class="px-5 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors"
                  >
                    {{ item.key }}
                  </td>
                  <td class="px-5 py-3.5 text-zinc-600 dark:text-zinc-300 truncate max-w-md">
                    {{ item.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Changes Card -->
        <div
          class="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#18181b] overflow-hidden shadow-sm"
        >
          <div
            class="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-transparent"
          >
            <h3
              class="m-0 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight"
            >
              Changes
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap border-collapse">
              <thead class="border-b border-zinc-200 dark:border-zinc-800/80">
                <tr>
                  <th
                    class="px-5 py-3 font-semibold w-1/4 text-zinc-900 dark:text-zinc-100 bg-transparent"
                  >
                    Field
                  </th>
                  <th
                    class="px-5 py-3 font-semibold w-3/8 text-zinc-900 dark:text-zinc-100 bg-transparent"
                  >
                    Before
                  </th>
                  <th
                    class="px-5 py-3 font-semibold w-3/8 text-zinc-900 dark:text-zinc-100 bg-transparent"
                  >
                    After
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                <tr v-if="selectedActivityChanges.length === 0">
                  <td
                    colspan="3"
                    class="px-5 py-8 text-center text-zinc-400 dark:text-zinc-500 font-sans"
                  >
                    Tidak ada perubahan field tercatat (Payload kosong).
                  </td>
                </tr>
                <tr
                  v-for="(change, index) in selectedActivityChanges"
                  v-else
                  :key="index"
                  class="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  <td
                    class="px-5 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors"
                  >
                    {{ change.field }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate"
                    :title="change.before"
                  >
                    {{ change.before }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate"
                    :title="change.after"
                  >
                    {{ change.after }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  </ClientOnly>
</template>
