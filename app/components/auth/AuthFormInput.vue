<script setup lang="ts">
/**
 * AuthFormInput: Reusable input field for authentication forms.
 * Handles label, error display, and dynamic border styling in one place.
 */
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    type?: string
    modelValue: string
    placeholder?: string
    autocomplete?: string
    error?: string
  }>(),
  {
    type: 'text',
    placeholder: '',
    autocomplete: 'off',
    error: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clearError'): void
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <slot name="label">
      <label :for="props.id" class="text-xs sm:text-sm font-semibold text-brand-ink">
        {{ props.label }}
      </label>
    </slot>

    <input
      :id="props.id"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :class="[
        'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white',
        'placeholder:text-zinc-400 outline-none transition-all',
        props.error
          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
          : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="emit('clearError')"
    />

    <Transition name="fade">
      <small v-if="props.error" class="text-red-500 text-xs font-medium">
        {{ props.error }}
      </small>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
