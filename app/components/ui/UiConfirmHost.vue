<script setup lang="ts">
import { computed } from 'vue'

const { confirmState, confirmBusy, accept, close } = useUiConfirm()

const variant = computed(() => {
  switch (confirmState.value?.tone ?? 'primary') {
    case 'danger':
      return 'danger'
    case 'success':
      return 'accent'
    case 'primary':
    default:
      return 'primary'
  }
})
</script>

<template>
  <UiModal
    :visible="!!confirmState"
    size="sm"
    :title="confirmState?.header"
    :close-on-escape="!confirmBusy"
    :close-on-overlay="!confirmBusy"
    @update:visible="close"
  >
    <p class="m-0 text-sm leading-relaxed text-brand-ink-soft">{{ confirmState?.message }}</p>

    <template #footer>
      <UiButton variant="ghost" size="sm" :disabled="confirmBusy" @click="close">
        {{ confirmState?.rejectLabel ?? 'Batal' }}
      </UiButton>
      <UiButton :variant="variant" size="sm" :loading="confirmBusy" @click="accept">
        {{ confirmState?.acceptLabel ?? 'Ya, Lanjutkan' }}
      </UiButton>
    </template>
  </UiModal>
</template>
