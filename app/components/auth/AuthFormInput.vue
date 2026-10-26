<script setup lang="ts">
/**
 * AuthFormInput: adapter tipis di atas UiInput untuk formulir autentikasi.
 * Meneruskan kontrak yang dipakai halaman auth (props + clearError) tanpa
 * menambah presentasi sendiri. Label, error, dan outline fokus milik UiInput.
 */
withDefaults(
  defineProps<{
    id: string
    label: string
    type?: string
    modelValue: string
    placeholder?: string
    autocomplete?: string
    error?: string
    showPasswordToggle?: boolean
  }>(),
  {
    type: 'text',
    placeholder: '',
    autocomplete: 'off',
    error: '',
    showPasswordToggle: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clearError'): void
}>()
</script>

<template>
  <UiInput
    :id="id"
    :model-value="modelValue"
    :label="label"
    :type="type"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :error="error"
    :show-password-toggle="type === 'password' ? showPasswordToggle : false"
    @update:model-value="emit('update:modelValue', $event)"
    @focus="emit('clearError')"
  />
</template>
