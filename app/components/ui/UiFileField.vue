<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    label?: string
    accept?: string
    disabled?: boolean
    error?: string
    hint?: string
    /** Nama file lama yang sudah tersimpan, ditampilkan sebagai konteks. */
    existingFileName?: string
  }>(),
  {
    label: 'Unggah Gambar',
    accept: 'image/*',
    disabled: false,
    error: '',
    hint: '',
    existingFileName: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
  reject: [reason: 'format' | 'size', file: File]
}>()

const uid = useId()
const inputId = `ui-file-${uid}`
const inputRef = ref<HTMLInputElement | null>(null)

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const fileName = computed(() => props.modelValue?.name ?? '')
const helperId = computed(() => `${inputId}-help`)

const onChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ACCEPTED_TYPES.includes(file.type)) {
    emit('reject', 'format', file)
    input.value = ''
    return
  }
  if (file.size > MAX_SIZE_BYTES) {
    emit('reject', 'size', file)
    input.value = ''
    return
  }

  emit('update:modelValue', file)
}

const clear = () => {
  emit('update:modelValue', null)
  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <span v-if="label" class="text-xs font-semibold text-brand-ink sm:text-sm">{{ label }}</span>

    <div
      class="flex flex-wrap items-center gap-2 rounded-field border border-dashed bg-brand-canvas px-3 py-2.5"
      :class="error ? 'border-rose-300' : 'border-brand-hair'"
    >
      <input
        :id="inputId"
        ref="inputRef"
        type="file"
        class="sr-only"
        :accept="accept"
        :disabled="disabled"
        :aria-describedby="error || hint ? helperId : undefined"
        @change="onChange"
      />

      <label
        :for="inputId"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas-soft px-3.5 py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-field focus-within:ring-2 focus-within:ring-brand-ink/30"
        :class="disabled ? 'pointer-events-none opacity-60' : ''"
      >
        <i class="pi pi-upload text-[10px]" aria-hidden="true" />
        <span>{{ fileName || label }}</span>
      </label>

      <button
        v-if="fileName"
        type="button"
        class="inline-flex items-center gap-1 rounded-full bg-brand-canvas px-2.5 py-1 text-[11px] font-semibold text-brand-muted transition-colors hover:bg-brand-field hover:text-brand-ink"
        @click="clear"
      >
        <i class="pi pi-times text-[9px]" aria-hidden="true" />
        <span>Batalkan pilihan</span>
      </button>
      <span v-else-if="existingFileName" class="truncate text-[11px] text-brand-muted">
        Tersimpan: {{ existingFileName }}
      </span>
    </div>

    <p v-if="error" :id="helperId" class="m-0 text-[11px] font-medium text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="helperId" class="m-0 text-[11px] text-brand-muted">{{ hint }}</p>
  </div>
</template>
