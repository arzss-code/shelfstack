<script setup lang="ts">
import { computed, ref, useId } from 'vue'

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
    /** Tampilkan tombol toggle tampilkan/sembunyikan kata sandi saat type="password". */
    showPasswordToggle?: boolean
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
    showPasswordToggle: false,
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

const isPasswordVisible = ref(false)
const effectiveType = computed(() => {
  if (props.type === 'password' && props.showPasswordToggle) {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const isIdentifierField = computed(() =>
  ['email', 'password', 'search', 'url', 'tel'].includes(props.type),
)

const effectiveInputMode = computed<'email' | 'tel' | 'url' | 'search' | 'decimal' | undefined>(
  () => {
    if (props.type === 'email') return 'email'
    if (props.type === 'tel') return 'tel'
    if (props.type === 'url') return 'url'
    if (props.type === 'search') return 'search'
    if (props.numeric) return 'decimal'
    return undefined
  },
)

const controlClass = computed(() => {
  const geometry = props.size === 'sm' ? 'h-9 rounded-full text-xs' : 'h-11 rounded-field text-sm'
  const border = props.error
    ? 'border-rose-300 focus:border-rose-500'
    : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink'
  const padding = props.leftIcon
    ? props.size === 'sm'
      ? 'pl-9'
      : 'pl-10'
    : props.size === 'sm'
      ? 'pl-3.5'
      : 'pl-4'
  const trailing =
    props.rightIcon || (props.showPasswordToggle && props.type === 'password')
      ? props.size === 'sm'
        ? 'pr-10'
        : 'pr-11'
      : props.size === 'sm'
        ? 'pr-3.5'
        : 'pr-4'

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
        :name="props.id"
        :type="effectiveType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :inputmode="effectiveInputMode"
        :spellcheck="isIdentifierField ? 'false' : undefined"
        :autocorrect="isIdentifierField ? 'off' : undefined"
        :autocapitalize="isIdentifierField ? 'off' : undefined"
        :min="min"
        :step="step"
        :aria-invalid="error ? 'true' : undefined"
        :aria-errormessage="error ? helpId : undefined"
        :aria-describedby="describedBy"
        :class="[controlClass, numeric ? 'tabular' : '']"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur')"
        @focus="emit('focus')"
      />

      <button
        v-if="showPasswordToggle && type === 'password'"
        type="button"
        :class="[
          'absolute top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink transition-colors flex items-center justify-center focus-visible:outline-brand-accent rounded-field cursor-pointer',
          size === 'sm'
            ? 'right-0 w-10 h-10 min-w-[40px] min-h-[40px]'
            : 'right-0 w-11 h-11 min-w-[44px] min-h-[44px]',
        ]"
        :aria-label="isPasswordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
        @click="isPasswordVisible = !isPasswordVisible"
      >
        <i
          :class="['pi text-xs sm:text-sm', isPasswordVisible ? 'pi-eye-slash' : 'pi-eye']"
          aria-hidden="true"
        />
      </button>

      <i
        v-else-if="rightIcon"
        :class="[
          'pi',
          rightIcon,
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[11px] text-brand-muted',
          size === 'sm' ? 'right-3' : 'right-3.5',
        ]"
        aria-hidden="true"
      />
    </div>

    <p
      v-if="error"
      :id="helpId"
      role="alert"
      aria-live="polite"
      class="m-0 text-[11px] font-medium text-rose-600"
    >
      {{ error }}
    </p>
    <p v-else-if="hint" :id="helpId" class="m-0 text-[11px] text-brand-muted">{{ hint }}</p>
  </div>
</template>
