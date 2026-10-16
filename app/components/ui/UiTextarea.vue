<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string
    label?: string
    placeholder?: string
    rows?: number
    error?: string
    hint?: string
    disabled?: boolean
    maxlength?: number
  }>(),
  {
    id: undefined,
    label: '',
    placeholder: '',
    rows: 3,
    error: '',
    hint: '',
    disabled: false,
    maxlength: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uid = useId()
const fieldId = computed(() => props.id ?? `ui-textarea-${uid}`)
const helpId = `${fieldId.value}-help`

const borderClass = computed(() =>
  props.error
    ? 'border-rose-300 focus:border-rose-500'
    : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink',
)
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label v-if="label" :for="fieldId" class="text-xs font-semibold text-brand-ink sm:text-sm">
      {{ label }}
    </label>

    <textarea
      :id="fieldId"
      :value="modelValue"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :placeholder="placeholder"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? helpId : undefined"
      :class="[
        'w-full resize-y rounded-field border bg-brand-canvas px-3.5 py-2.5 text-sm text-brand-ink',
        'placeholder:text-brand-faint transition-colors',
        'disabled:cursor-not-allowed disabled:bg-brand-field disabled:text-brand-muted',
        borderClass,
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <p v-if="error" :id="helpId" class="m-0 text-[11px] font-medium text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="helpId" class="m-0 text-[11px] text-brand-muted">{{ hint }}</p>
  </div>
</template>
