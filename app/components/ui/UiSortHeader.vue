<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Kunci kolom yang dikirim ke server. */
  sortKey: string
  /** Kunci kolom yang sedang aktif, null bila tabel belum diurutkan. */
  activeKey: string | null
  /** Arah aktif, null bersama `activeKey` null. */
  direction: 'asc' | 'desc' | null
  /** Nama kolom untuk pengumuman screen reader. */
  label: string
  align?: 'left' | 'right' | 'center'
}>()

const emit = defineEmits<{
  sort: [payload: { key: string; direction: 'desc' | 'asc' | null }]
}>()

const isActive = computed(() => props.activeKey === props.sortKey)

const iconClass = computed(() => {
  if (!isActive.value || !props.direction) return 'pi pi-sort-alt'
  return props.direction === 'desc' ? 'pi pi-sort-down' : 'pi pi-sort-up'
})

const a11yLabel = computed(() => {
  if (!isActive.value) return `Urutkan berdasarkan ${props.label}`
  if (props.direction === 'desc') return `Urutkan ${props.label} menaik`
  if (props.direction === 'asc') return `Urutkan ${props.label} menurun`
  return `Hapus urutan ${props.label}`
})

const trigger = () => {
  if (!isActive.value || !props.direction) {
    emit('sort', { key: props.sortKey, direction: 'desc' })
  } else if (props.direction === 'desc') {
    emit('sort', { key: props.sortKey, direction: 'asc' })
  } else {
    emit('sort', { key: props.sortKey, direction: null })
  }
}
</script>

<template>
  <button
    type="button"
    :aria-label="a11yLabel"
    class="group/sort inline-flex items-center gap-1 rounded-full px-1 py-0.5 font-semibold uppercase tracking-wider text-[11px] transition-colors hover:bg-brand-field"
    :class="[
      align === 'right' ? 'flex-row-reverse' : '',
      isActive ? 'text-brand-ink' : 'text-brand-muted hover:text-brand-ink',
    ]"
    @click="trigger"
  >
    <span><slot /></span>
    <i
      :class="[
        iconClass,
        'text-[10px] transition-opacity',
        isActive ? 'opacity-100' : 'opacity-45 group-hover/sort:opacity-80',
      ]"
      aria-hidden="true"
    />
  </button>
</template>
