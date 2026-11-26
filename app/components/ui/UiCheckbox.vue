<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    id?: string
    label?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    id: undefined,
    label: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const generatedId = useId()
const checkboxId = computed(() => props.id ?? `ui-checkbox-${generatedId}`)

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label
    :for="checkboxId"
    class="inline-flex items-start gap-2.5 select-none"
    :class="disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'"
  >
    <span
      class="relative mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center"
    >
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="peer sr-only"
        @change="onChange"
      />
      <span
        aria-hidden="true"
        class="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-brand-ink peer-focus-visible:outline-offset-0"
        :class="
          modelValue
            ? 'border-brand-ink bg-brand-ink text-brand-onink shadow-xs'
            : 'border-brand-hair bg-brand-canvas hover:border-brand-ink/70'
        "
      >
        <svg
          v-if="modelValue"
          viewBox="0 0 12 10"
          class="h-2.5 w-2.5 fill-none stroke-current"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="1.5 5.5 4.5 8.5 10.5 1.5" />
        </svg>
      </span>
    </span>
    <span v-if="label || $slots.default" class="text-xs font-medium leading-snug text-brand-ink">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
