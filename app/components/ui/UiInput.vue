<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string | number | undefined
    label?: string
    type?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    leftIcon?: string
    rightIcon?: string
    /** `sm` untuk strip filter admin, `md` untuk field formulir. */
    size?: 'sm' | 'md'
    /** Angka currency dan stok: digit sejajar secara optik. */
    numeric?: boolean
    autocomplete?: string
    /** Batas bawah untuk input angka. Root komponen adalah div, jadi atribut ini wajib dideklarasikan agar mendarat di input. */
    min?: number
    /** Kenaikan spinner untuk input angka. */
    step?: number
  }>(),
  {
    id: undefined,
    label: '',
    type: 'text',
    placeholder: '',
    error: '',
    hint: '',
    disabled: false,
    leftIcon: '',
    rightIcon: '',
    size: 'md',
    numeric: false,
    autocomplete: undefined,
    min: undefined,
    step: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()

const uid = useId()
const fieldId = computed(() => props.id ?? `ui-input-${uid}`)
const helpId = computed(() => `${fieldId.value}-help`)
const describedBy = computed(() => (props.error || props.hint ? helpId.value : undefined))

const controlClass = computed(() => {
  const geometry =
    props.size === 'sm'
      ? 'h-8 rounded-full pl-8 pr-3 text-xs'
      : 'h-11 rounded-field pl-3.5 pr-3.5 text-sm'
  const border = props.error
    ? 'border-rose-300 focus:border-rose-500'
    : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink'
  const padding = props.leftIcon ? '' : props.size === 'sm' ? 'pl-3' : 'pl-3.5'
  const trailing = props.rightIcon ? (props.size === 'sm' ? 'pr-8' : 'pr-10') : ''

  return [
    'w-full border bg-brand-canvas text-brand-ink transition-colors',
    'placeholder:text-brand-faint',
    'disabled:cursor-not-allowed disabled:bg-brand-field disabled:text-brand-muted',
    geometry,
    padding,
    trailing,
    border,
  ].join(' ')
})
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label v-if="label" :for="fieldId" class="text-xs font-semibold text-brand-ink sm:text-sm">
      {{ label }}
    </label>

    <div class="relative w-full">
      <i
        v-if="leftIcon"
        :class="[
          'pi',
          leftIcon,
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[11px] text-brand-muted',
          size === 'sm' ? 'left-3' : 'left-3.5',
        ]"
        aria-hidden="true"
      />

      <input
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :min="min"
        :step="step"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="[controlClass, numeric ? 'tabular' : '']"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur')"
        @focus="emit('focus')"
      />

      <i
        v-if="rightIcon"
        :class="[
          'pi',
          rightIcon,
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[11px] text-brand-muted',
          size === 'sm' ? 'right-3' : 'right-3.5',
        ]"
        aria-hidden="true"
      />
    </div>

    <p v-if="error" :id="helpId" class="m-0 text-[11px] font-medium text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="helpId" class="m-0 text-[11px] text-brand-muted">{{ hint }}</p>
  </div>
</template>
