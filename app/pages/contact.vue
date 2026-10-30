<script setup lang="ts">
import { ref } from 'vue'
import { useUiToast } from '~/composables/useUiToast'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'

try {
  useSeoMeta({
    title: 'Hubungi Kami - Layanan Pelanggan ShelfStack',
    description:
      'Hubungi tim kurasi dan layanan pelanggan ShelfStack untuk bantuan pesanan, spesifikasi produk, klaim garansi, atau kemitraan studio.',
  })
} catch {
  // Fallback aman untuk lingkungan unit test tanpa instance NuxtApp
}

const toast = useUiToast()

interface ContactForm {
  name: string
  email: string
  category: string
  orderNumber: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  category?: string
  message?: string
}

const form = ref<ContactForm>({
  name: '',
  email: '',
  category: '',
  orderNumber: '',
  message: '',
})

const errors = ref<FormErrors>({})
const isLoading = ref(false)

const categoryOptions = [
  { value: 'Pertanyaan Produk', label: 'Pertanyaan Produk' },
  { value: 'Status Pemesanan', label: 'Status Pemesanan' },
  { value: 'Klaim Garansi & Retur', label: 'Klaim Garansi & Retur' },
  { value: 'Kemitraan Studio B2B', label: 'Kemitraan Studio B2B' },
]

const clearError = (field: keyof FormErrors) => {
  if (errors.value[field]) {
    errors.value = { ...errors.value, [field]: undefined }
  }
}

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}
  const trimmedName = form.value.name.trim()
  const trimmedEmail = form.value.email.trim()
  const trimmedCategory = form.value.category.trim()
  const trimmedMessage = form.value.message.trim()

  if (!trimmedName) {
    newErrors.name = 'Nama lengkap wajib diisi'
  } else if (trimmedName.length < 3) {
    newErrors.name = 'Nama lengkap minimal 3 karakter'
  }

  if (!trimmedEmail) {
    newErrors.email = 'Alamat email wajib diisi'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    newErrors.email = 'Format alamat email tidak valid'
  }

  if (!trimmedCategory) {
    newErrors.category = 'Silakan pilih kategori pertanyaan'
  }

  if (!trimmedMessage) {
    newErrors.message = 'Pesan atau kendala wajib diisi'
  } else if (trimmedMessage.length < 10) {
    newErrors.message = 'Pesan minimal 10 karakter'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.show({
      title: 'Pesan Terkirim',
      message: 'Tim dukungan ShelfStack akan merespons dalam 1x24 jam kerja.',
      tone: 'success',
    })
    form.value = {
      name: '',
      email: '',
      category: '',
      orderNumber: '',
      message: '',
    }
    errors.value = {}
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="py-4 sm:py-8">
    <!-- Breadcrumb -->
    <nav class="mb-8 flex items-center gap-2 text-xs text-brand-muted" aria-label="Breadcrumb">
      <NuxtLink to="/" class="no-underline transition-colors hover:text-brand-ink">
        Beranda
      </NuxtLink>
      <span class="text-brand-hair">/</span>
      <span class="font-semibold text-brand-ink">Hubungi Kami</span>
    </nav>

    <!-- Header Section -->
    <div class="mb-10 sm:mb-14">
      <div class="mb-3 inline-flex items-center gap-2">
        <UiBadge label="Layanan Pelanggan" variant="info" />
        <span class="text-xs font-medium text-brand-muted">Bantuan &amp; Dukungan Resmi</span>
      </div>
      <h1
        class="mb-3 font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Hubungi Tim ShelfStack
      </h1>
      <p class="max-w-2xl font-body text-sm leading-relaxed text-brand-muted sm:text-base">
        Punya pertanyaan seputar spesifikasi teknis produk, bantuan pemesanan, klaim garansi resmi,
        atau proposal penataan meja studio Anda? Tim kurasi kami siap memberikan jawaban yang
        akurat.
      </p>
    </div>

    <!-- Two-Column Layout -->
    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
      <!-- Left Column: Saluran Resmi & Informasi Layanan -->
      <div class="space-y-6 lg:col-span-5">
        <!-- Saluran Resmi Card -->
        <UiCard :padded="true" class="space-y-6 border-brand-hair bg-white">
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
                href="mailto:support@shelfstack.id"
                class="font-display text-sm font-semibold text-brand-ink transition-colors hover:text-brand-accent hover:underline"
              >
                support@shelfstack.id
              </a>
              <p class="mt-0.5 text-xs text-brand-muted">
                Tanggapan langsung dalam 1x24 jam kerja.
              </p>
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
        <div class="rounded-card border border-brand-hair bg-white p-4">
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

      <!-- Right Column: Formulir Kontak Interaktif -->
      <div class="lg:col-span-7">
        <UiCard :padded="true" class="border-brand-hair bg-white">
          <div class="mb-6 border-b border-brand-hair pb-4">
            <h2 class="font-display text-lg font-bold text-brand-ink">Kirimkan Pesan</h2>
            <p class="mt-1 text-xs text-brand-muted">
              Isi formulir di bawah ini dengan lengkap agar kami dapat menindaklanjuti kendala Anda
              secara tepat.
            </p>
          </div>

          <form class="space-y-4 sm:space-y-5" @submit.prevent="handleSubmit">
            <!-- Nama Lengkap -->
            <UiInput
              id="contact-name"
              v-model="form.name"
              label="Nama Lengkap"
              placeholder="Contoh: Arya Danu"
              :error="errors.name"
              @update:model-value="clearError('name')"
            />

            <!-- Alamat Email -->
            <UiInput
              id="contact-email"
              v-model="form.email"
              type="email"
              label="Alamat Email"
              placeholder="nama@domain.com"
              :error="errors.email"
              @update:model-value="clearError('email')"
            />

            <!-- Kategori Pertanyaan -->
            <UiSelect
              id="contact-category"
              v-model="form.category"
              :options="categoryOptions"
              label="Kategori Pertanyaan"
              placeholder="Pilih Kategori Pertanyaan"
              block
              :error="errors.category"
              @update:model-value="clearError('category')"
            />

            <!-- Nomor Pesanan (Opsional) -->
            <UiInput
              id="contact-order-number"
              v-model="form.orderNumber"
              label="Nomor Pesanan (Opsional)"
              placeholder="Contoh: ORD-20261028-1001"
              hint="Cantumkan nomor pesanan jika pertanyaan terkait pengiriman atau garansi."
            />

            <!-- Pesan / Kendala -->
            <UiTextarea
              id="contact-message"
              v-model="form.message"
              label="Pesan / Kendala"
              placeholder="Tuliskan detail pertanyaan, nomor SKU produk, atau kendala yang Anda alami..."
              :rows="5"
              :error="errors.message"
              @update:model-value="clearError('message')"
            />

            <!-- Tombol Submit -->
            <div class="pt-2">
              <UiButton type="submit" variant="primary" size="lg" block :loading="isLoading">
                Kirim Pesan
              </UiButton>
            </div>
          </form>
        </UiCard>
      </div>
    </div>
  </div>
</template>
