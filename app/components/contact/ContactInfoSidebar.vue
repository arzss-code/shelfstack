<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

const handleOpenLiveChat = () => {
  try {
    const { toggleChat } = useSupportChat()
    toggleChat()
  } catch {
    // Fallback for test environments without Nuxt context
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Saluran Resmi Card -->
    <UiCard :padded="true" class="space-y-6 border-brand-hair bg-brand-canvas">
      <div class="border-b border-brand-hair pb-4">
        <h2 class="font-display text-lg font-bold text-brand-ink">
          Saluran Resmi &amp; Informasi Layanan
        </h2>
        <p class="mt-1 text-xs text-brand-muted">
          Pusat komunikasi resmi untuk pelanggan dan mitra studio ShelfStack.
        </p>
      </div>

      <!-- Email -->
      <div class="flex items-start gap-3.5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-envelope text-sm" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Email Dukungan
          </p>
          <a
            href="mailto:support@shelfstack.atsiilaarya.me"
            class="font-display text-sm font-semibold text-brand-ink transition-colors hover:text-brand-accent hover:underline"
          >
            support@shelfstack.atsiilaarya.me
          </a>
          <p class="mt-0.5 text-xs text-brand-muted">Tanggapan langsung dalam 1x24 jam kerja.</p>
        </div>
      </div>

      <!-- Alamat Gudang Kurasi -->
      <div class="flex items-start gap-3.5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-map-marker text-sm" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Gudang Kurasi Sentral
          </p>
          <p class="font-display text-sm font-semibold text-brand-ink">
            Kawasan Industri Candi Blok C-12
          </p>
          <p class="text-xs leading-relaxed text-brand-muted">
            Semarang, Jawa Tengah 50181, Indonesia
          </p>
          <p class="mt-0.5 text-[11px] text-brand-muted">
            Fasilitas inspeksi mutu fisik dan logistik terpusat.
          </p>
        </div>
      </div>

      <!-- Jam Operasional -->
      <div class="flex items-start gap-3.5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-clock text-sm" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Jam Operasional
          </p>
          <p class="font-display text-sm font-semibold text-brand-ink">
            Senin - Jumat 09:00 - 18:00 WIB
          </p>
          <p class="mt-0.5 text-xs text-brand-muted">
            Sabtu, Minggu &amp; Hari Libur Nasional: Tutup
          </p>
        </div>
      </div>
    </UiCard>

    <!-- Quick Links Card -->
    <UiCard :padded="true" class="space-y-4 border-brand-hair bg-brand-canvas-soft">
      <div>
        <h3 class="font-display text-sm font-bold text-brand-ink">Perlu Bantuan Instan?</h3>
        <p class="mt-1 text-xs text-brand-muted">
          Gunakan layanan mandiri tanpa perlu menunggu balasan email:
        </p>
      </div>

      <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        <UiButton
          type="button"
          variant="primary"
          size="sm"
          icon="pi-comments"
          block
          class="justify-start"
          data-testid="btn-live-chat"
          @click="handleOpenLiveChat"
        >
          Buka Live Chat
        </UiButton>

        <UiButton
          to="/help"
          variant="outline"
          size="sm"
          icon="pi-question-circle"
          block
          class="justify-start"
        >
          Pusat Bantuan &amp; FAQ
        </UiButton>

        <UiButton
          to="/tracking"
          variant="outline"
          size="sm"
          icon="pi-compass"
          block
          class="justify-start"
        >
          Lacak Status Pesanan
        </UiButton>
      </div>
    </UiCard>

    <!-- Security & Privacy Note -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-shield text-xs text-brand-success" />
        <p class="text-xs font-medium text-brand-ink">Privasi &amp; Keamanan Terjamin</p>
      </div>
      <p class="mt-1 text-[11px] leading-relaxed text-brand-muted">
        Data pribadi dan detail pesanan Anda dilindungi penuh dan hanya digunakan untuk
        menyelesaikan kendala layanan Anda.
      </p>
    </div>
  </div>
</template>
