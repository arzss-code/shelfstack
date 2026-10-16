<script setup lang="ts">
/**
 * AuthSubmitButton: Primary CTA button for auth forms.
 * Handles loading spinner, disabled state, and icon in one place.
 */
withDefaults(
  defineProps<{
    loading?: boolean
    label: string
    loadingLabel?: string
    icon?: string
  }>(),
  {
    loading: false,
    loadingLabel: 'Memproses...',
    icon: 'pi-arrow-right',
  },
)
</script>

<template>
  <UiButton
    type="submit"
    variant="primary"
    block
    :loading="loading"
    :icon="loading ? undefined : icon"
    class="mt-2 h-11"
  >
    {{ loading ? loadingLabel : label }}
  </UiButton>
</template>
