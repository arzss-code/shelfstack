<script setup lang="ts">
import { compressImage } from '~/utils/image'
import { z } from 'zod'
import { useCategories } from '~/composables/useCategories'

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama produk minimal 3 karakter.')
    .max(120, 'Nama produk maksimal 120 karakter.'),
  price: z.number({ message: 'Harga wajib diisi.' }).positive('Harga harus lebih dari 0.'),
  stock: z
    .number({ message: 'Stok wajib diisi.' })
    .int('Stok harus bilangan bulat.')
    .min(0, 'Stok minimal 0.'),
  category_id: z.string().uuid('Kategori tidak valid.').nullish(),
  link: z
    .union([
      z.string().url('Format link tidak valid (gunakan http:// atau https://).'),
      z.literal(''),
      z.null(),
    ])
    .optional(),
})

const props = defineProps<{
  initialData?: {
    id: number
    name: string
    price: number
    description?: string | null
    link?: string | null
    image_url: string | null
    stock?: number
    category_id?: string | null
  } | null
  loading?: boolean
}>()

const emit = defineEmits<{
  save: [
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
    stock: number,
    categoryId: string | null,
  ]
  cancel: []
}>()

const visible = defineModel<boolean>('visible', { default: false })
const toast = useUiToast()
const { categories, fetchCategories } = useCategories()

const name = ref('')
const price = ref<number | null>(null)
const stock = ref<number>(0)
const categoryId = ref<string | null>(null)
const description = ref<string | null>(null)
const link = ref<string | null>(null)
/** File hasil kompresi yang benar-benar dikirim ke server. */
const imageFile = shallowRef<File | null>(null)
/** File mentah hasil pilihan pengguna, dipakai sebagai sumber kompresi. */
const selectedFile = shallowRef<File | null>(null)

const errors = ref<{
  name?: string
  price?: string
  stock?: string
  category_id?: string
  link?: string
}>({})

// UiInput dan UiSelect selalu mengirim string, jadi ref numerik dan nullable dijembatani adapter.
const priceModel = computed({
  get: () => (price.value === null ? '' : String(price.value)),
  set: (value: string) => {
    const parsed = Number(value)
    price.value = value.trim() === '' || Number.isNaN(parsed) ? null : parsed
  },
})

const stockModel = computed({
  get: () => String(stock.value),
  set: (value: string) => {
    const parsed = Number(value)
    stock.value = value.trim() === '' || Number.isNaN(parsed) ? 0 : parsed
  },
})

const categoryIdModel = computed({
  get: () => categoryId.value ?? '',
  set: (value: string) => {
    categoryId.value = value === '' ? null : value
  },
})

const linkModel = computed({
  get: () => link.value ?? '',
  set: (value: string) => {
    link.value = value
  },
})

const descriptionModel = computed({
  get: () => description.value ?? '',
  set: (value: string) => {
    description.value = value
  },
})

const imageHint = computed(() =>
  props.initialData?.image_url ? '* Biarkan kosong jika tidak ingin mengubah gambar.' : '',
)

onMounted(() => {
  fetchCategories()
})

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      name.value = newVal.name
      price.value = newVal.price
      stock.value = newVal.stock ?? 0
      categoryId.value = newVal.category_id || null
      description.value = newVal.description || null
      link.value = newVal.link || null
    } else {
      name.value = ''
      price.value = null
      stock.value = 0
      categoryId.value = null
      description.value = null
      link.value = null
    }
    imageFile.value = null
    selectedFile.value = null
    errors.value = {}
  },
  { immediate: true },
)

// UiFileField sudah menolak format dan ukuran di dalam dirinya, di sini hanya pesannya yang ditampilkan.
const onFileReject = (reason: 'format' | 'size') => {
  if (reason === 'format') {
    toast.add({
      severity: 'error',
      summary: 'Format Ditolak',
      detail: 'Hanya format JPEG, PNG, dan WebP yang diizinkan sesuai SOP.',
      life: 5000,
    })
    return
  }

  toast.add({
    severity: 'error',
    summary: 'Ukuran Berlebih',
    detail: 'Ukuran maksimal file mentah adalah 5 MB.',
    life: 5000,
  })
}

watch(selectedFile, async (file) => {
  if (!file) {
    imageFile.value = null
    return
  }

  try {
    imageFile.value = await compressImage(file)
  } catch {
    imageFile.value = null
    toast.add({
      severity: 'error',
      summary: 'Gagal Memproses',
      detail: 'Terjadi kesalahan saat memproses gambar.',
      life: 5000,
    })
  }
})

const validateForm = (): boolean => {
  errors.value = {}

  const result = productFormSchema.safeParse({
    name: name.value,
    price: price.value,
    stock: stock.value,
    category_id: categoryId.value || null,
    link: link.value,
  })

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof typeof errors.value
      if (!errors.value[field]) {
        errors.value[field] = issue.message
      }
    })
    return false
  }

  return true
}

const handleSave = () => {
  if (!validateForm()) return
  emit(
    'save',
    name.value,
    price.value as number,
    description.value,
    link.value,
    imageFile.value,
    stock.value,
    categoryId.value || null,
  )
  visible.value = false
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<template>
  <UiModal
    v-model:visible="visible"
    size="md"
    :title="initialData ? 'Edit Produk' : 'Tambah Produk'"
  >
    <div class="grid w-full grid-cols-1 gap-4">
      <!-- Nama Produk -->
      <UiInput
        id="name"
        v-model="name"
        label="Nama Produk"
        type="text"
        autocomplete="off"
        placeholder="Contoh: Kemeja Linen Vintage"
        :error="errors.name"
      />

      <!-- Kategori Produk Dropdown -->
      <UiSelect
        id="category"
        v-model="categoryIdModel"
        label="Kategori Produk"
        block
        :error="errors.category_id"
      >
        <option value="">-- Pilih Kategori --</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </UiSelect>

      <!-- Harga & Stok (Grid 2 Kolom) -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput
          id="price"
          v-model="priceModel"
          label="Harga (IDR)"
          type="number"
          numeric
          :step="1"
          placeholder="Contoh: 150000"
          :error="errors.price"
        />

        <UiInput
          id="stock"
          v-model="stockModel"
          label="Stok Fisik"
          type="number"
          numeric
          :min="0"
          :step="1"
          :error="errors.stock"
        />
      </div>

      <!-- Deskripsi -->
      <UiTextarea id="description" v-model="descriptionModel" label="Deskripsi" :rows="3" />

      <!-- Tautan Referensi -->
      <UiInput
        id="link"
        v-model="linkModel"
        label="Tautan Referensi (Opsional)"
        type="text"
        placeholder="https://..."
        :error="errors.link"
      />

      <!-- Upload Gambar -->
      <UiFileField
        v-model="selectedFile"
        label="Gambar Produk"
        accept="image/jpeg,image/png,image/webp"
        :hint="imageHint"
        @reject="onFileReject"
      />
    </div>

    <template #footer>
      <UiButton variant="secondary" @click="handleCancel">Batal</UiButton>
      <UiButton variant="primary" :loading="loading" @click="handleSave">Simpan</UiButton>
    </template>
  </UiModal>
</template>
