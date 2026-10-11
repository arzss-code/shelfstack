<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string | number | undefined
    label?: string
    type?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    leftIcon?: string
    rightIcon?: string
  }>(),
  {
    id: () => `input-${Math.random().toString(36).substring(2, 9)}`,
    label: '',
    type: 'text',
    placeholder: '',
    error: '',
    disabled: false,
    leftIcon: '',
    rightIcon: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Label -->
    <label v-if="label" :for="id" class="text-xs sm:text-sm font-semibold text-brand-ink">
      {{ label }}
    </label>

    <!-- Input Wrapper -->
    <div class="relative w-full">
      <!-- Left Icon -->
      <div v-if="leftIcon" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted">
        <i :class="['pi', leftIcon, 'text-sm']" />
      </div>

      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full h-11 rounded-xl border text-sm bg-white transition-all outline-none',
          'placeholder:text-zinc-400',
          leftIcon ? 'pl-10' : 'pl-4',
          rightIcon ? 'pr-10' : 'pr-4',
          disabled
            ? 'opacity-60 bg-brand-canvas-soft cursor-not-allowed text-brand-muted'
            : 'text-brand-ink',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur')"
        @focus="emit('focus')"
      />

      <!-- Right Icon -->
      <div v-if="rightIcon" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted">
        <i :class="['pi', rightIcon, 'text-sm']" />
      </div>
    </div>

    <!-- Error Message -->
    <Transition name="fade">
      <span v-if="error" class="text-red-500 text-[11px] font-medium leading-tight">
        {{ error }}
      </span>
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
