<script setup lang="ts">
defineProps<{
  currentStep: number
}>()

const steps = [
  { step: 1, label: 'Diajukan' },
  { step: 2, label: 'Disetujui' },
  { step: 3, label: 'Inspeksi Gudang' },
  { step: 4, label: 'Selesai' },
] as const
</script>

<template>
  <div class="py-4 border-b border-brand-hairsoft">
    <div class="grid grid-cols-4 gap-2 text-center">
      <div v-for="item in steps" :key="item.step" class="flex flex-col items-center gap-1.5">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
          :class="
            item.step === 4
              ? currentStep >= 4
                ? 'bg-brand-success text-white'
                : 'bg-brand-field text-brand-muted'
              : currentStep >= item.step
                ? 'bg-brand-ink text-brand-onink'
                : 'bg-brand-field text-brand-muted'
          "
        >
          <i
            v-if="item.step === 4 ? currentStep === 4 : currentStep > item.step"
            class="pi pi-check text-[10px]"
          />
          <span v-else>{{ item.step }}</span>
        </div>
        <span class="text-[10px] font-medium leading-tight text-brand-ink">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>
