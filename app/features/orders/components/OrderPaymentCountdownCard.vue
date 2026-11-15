<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ORDER_EXPIRY_MINUTES } from '~~/shared/constants/order-expiry'

const props = withDefaults(
  defineProps<{
    createdAt: string
    expiryMinutes?: number
  }>(),
  {
    expiryMinutes: ORDER_EXPIRY_MINUTES,
  },
)

const emit = defineEmits<{
  expired: []
}>()

let timer: ReturnType<typeof setInterval> | null = null

const calculateRemaining = () => {
  if (!props.createdAt) return 0
  const createdMs = new Date(props.createdAt).getTime()
  if (Number.isNaN(createdMs)) return 0
  const expiryMs = createdMs + props.expiryMinutes * 60 * 1000
  const diffSec = Math.floor((expiryMs - Date.now()) / 1000)
  return Math.max(0, diffSec)
}

const remainingSeconds = ref(calculateRemaining())

const formattedTime = computed(() => {
  const hours = Math.floor(remainingSeconds.value / 3600)
  const mins = Math.floor((remainingSeconds.value % 3600) / 60)
  const secs = remainingSeconds.value % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
})

const expiryLabel = computed(() => {
  const hours = Math.round(props.expiryMinutes / 60)
  return hours >= 1 ? `${hours} jam` : `${props.expiryMinutes} menit`
})

const isExpired = computed(() => remainingSeconds.value <= 0)

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startTimer = () => {
  stopTimer()
  remainingSeconds.value = calculateRemaining()
  if (remainingSeconds.value <= 0) {
    emit('expired')
    return
  }

  timer = setInterval(() => {
    remainingSeconds.value = calculateRemaining()
    if (remainingSeconds.value <= 0) {
      stopTimer()
      emit('expired')
    }
  }, 1000)
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

watch(
  () => props.createdAt,
  () => {
    startTimer()
  },
)
</script>

<template>
  <div
    :class="[
      'p-3.5 rounded-xl border transition-colors',
      isExpired
        ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200'
        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200',
    ]"
    role="timer"
    aria-live="polite"
  >
    <div class="flex items-center justify-between gap-2 mb-1.5">
      <div class="flex items-center gap-1.5 text-xs font-semibold">
        <i
          :class="[
            'text-xs',
            isExpired
              ? 'pi pi-times-circle text-red-600'
              : 'pi pi-clock text-amber-600 animate-pulse',
          ]"
        />
        <span>{{ isExpired ? 'Waktu Pembayaran Habis' : 'Batas Waktu Pembayaran' }}</span>
      </div>
      <span
        :class="[
          'font-mono text-sm font-bold tracking-wider tabular-nums px-2 py-0.5 rounded',
          isExpired
            ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
        ]"
      >
        {{ formattedTime }}
      </span>
    </div>
    <p class="text-[11px] leading-relaxed text-brand-muted m-0">
      {{
        isExpired
          ? `Batas waktu ${expiryLabel} telah berakhir. Pesanan ini dibatalkan otomatis oleh antrean sistem.`
          : 'Selesaikan transaksi Anda sebelum batas waktu berakhir untuk mengamankan stok produk.'
      }}
    </p>
  </div>
</template>
