<script setup lang="ts">
interface Props {
  imageUrl: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="imageUrl"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    @click="emit('close')"
  >
    <button
      type="button"
      class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 text-xs"
      aria-label="Tutup pratinjau"
      @click="emit('close')"
    >
      <i class="pi pi-times text-base" />
    </button>
    <img
      :src="imageUrl"
      alt="Pratinjau lampiran"
      class="max-h-[85vh] max-w-[85vw] rounded-card object-contain shadow-floating"
      @click.stop
    />
  </div>
</template>
