<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string | number | null
    /** Label field di atas kontrol. */
    label?: string
    /** Placeholder untuk input teks bawaan, bukan native select. */
    placeholder?: string
    disabled?: boolean
    error?: string
    /** Sarana bantu di bawah kontrol, tampil hanya bila tidak ada error. */
    hint?: string
    /** `sm` untuk strip filter admin, `md` untuk field formulir. */
    size?: 'sm' | 'md'
    block?: boolean
  }>(),
  {
    id: undefined,
    label: '',
    placeholder: '',
    disabled: false,
    error: '',
    hint: '',
    size: 'md',
    block: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uid = useId()
const selectId = computed(() => props.id ?? `ui-select-${uid}`)
const describedBy = computed(() =>
  props.error || props.hint ? `${selectId.value}-help` : undefined,
)

const controlClass = computed(() => {
  const geometry =
    props.size === 'sm'
      ? 'h-8 rounded-full py-1 pl-3 pr-8 text-xs'
      : 'h-11 rounded-field py-2.5 pl-3.5 pr-10 text-sm'
  const border = props.error
    ? 'border-rose-300 focus:border-rose-500'
    : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink'
  return [
    'w-full appearance-none border bg-brand-canvas text-brand-ink transition-colors',
    'cursor-pointer disabled:cursor-not-allowed disabled:bg-brand-field disabled:text-brand-muted',
    geometry,
    border,
  ].join(' ')
})
</script>

<template>
  <div :class="['flex flex-col gap-1.5', block ? 'w-full' : '']">
    <label v-if="label" :for="selectId" class="text-xs font-semibold text-brand-ink sm:text-sm">
      {{ label }}
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="controlClass"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <slot />
      </select>

      <i
        class="pi pi-chevron-down pointer-events-none absolute top-1/2 -translate-y-1/2 text-[10px] text-brand-muted"
        :class="size === 'sm' ? 'right-3' : 'right-3.5'"
        aria-hidden="true"
      />
    </div>

    <p v-if="error" :id="describedBy" class="m-0 text-[11px] font-medium text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="describedBy" class="m-0 text-[11px] text-brand-muted">{{ hint }}</p>
  </div>
</template>
