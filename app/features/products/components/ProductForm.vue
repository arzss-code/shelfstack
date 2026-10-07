<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
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
const toast = useToast()
const { categories, fetchCategories } = useCategories()

const name = ref('')
const price = ref<number | null>(null)
const stock = ref<number>(0)
const categoryId = ref<string | null>(null)
const description = ref<string | null>(null)
const link = ref<string | null>(null)
const imageFile = shallowRef<File | null>(null)

const errors = ref<{
  name?: string
  price?: string
  stock?: string
  category_id?: string
  link?: string
}>({})

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
    errors.value = {}
  },
  { immediate: true },
)

const onFileSelect = async (event: any) => {
  const file = event.files[0] as File
  if (!file) return

  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedFormats.includes(file.type)) {
    toast.add({
      severity: 'error',
      summary: 'Format Ditolak',
      detail: 'Hanya format JPEG, PNG, dan WebP yang diizinkan sesuai SOP.',
      life: 5000,
    })
    event.options.clear()
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    toast.add({
      severity: 'error',
      summary: 'Ukuran Berlebih',
      detail: 'Ukuran maksimal file mentah adalah 5 MB.',
      life: 5000,
    })
    event.options.clear()
    return
  }

  try {
    const compressed = await compressImage(file)
    imageFile.value = compressed
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memproses',
      detail: 'Terjadi kesalahan saat memproses gambar.',
      life: 5000,
    })
  }
}

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
  <Dialog
    v-model:visible="visible"
    modal
    :header="initialData ? 'Edit Produk' : 'Tambah Produk'"
    :style="{ width: '32rem' }"
  >
    <div class="grid grid-cols-1 gap-4 mt-4 w-full">
      <!-- Nama Produk -->
      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0">
          Nama Produk
        </label>
        <InputText
          id="name"
          v-model="name"
          autofocus
          autocomplete="off"
          placeholder="Contoh: Kemeja Linen Vintage"
          :class="[{ 'p-invalid': errors.name }, 'w-full']"
        />
        <small v-if="errors.name" class="text-red-500 font-medium">{{ errors.name }}</small>
      </div>

      <!-- Kategori Produk Dropdown -->
      <div class="flex flex-col gap-1.5">
        <label
          for="category"
          class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0"
        >
          Kategori Produk
        </label>
        <select
          id="category"
          v-model="categoryId"
          class="w-full rounded-lg border border-brand-hair bg-brand-canvas p-2.5 text-xs text-brand-ink focus:border-brand-ink focus:outline-none"
        >
          <option :value="null">-- Pilih Kategori --</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        <small v-if="errors.category_id" class="text-red-500 font-medium">{{
          errors.category_id
        }}</small>
      </div>

      <!-- Harga & Stok (Grid 2 Kolom) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            for="price"
            class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0"
          >
            Harga (IDR)
          </label>
          <InputNumber
            id="price"
            v-model="price"
            mode="currency"
            currency="IDR"
            locale="id-ID"
            class="w-full"
            :class="{ 'p-invalid': errors.price }"
          />
          <small v-if="errors.price" class="text-red-500 font-medium">{{ errors.price }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            for="stock"
            class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0"
          >
            Stok Fisik
          </label>
          <InputNumber
            id="stock"
            v-model="stock"
            :min="0"
            show-buttons
            class="w-full"
            :class="{ 'p-invalid': errors.stock }"
          />
          <small v-if="errors.stock" class="text-red-500 font-medium">{{ errors.stock }}</small>
        </div>
      </div>

      <!-- Deskripsi -->
      <div class="flex flex-col gap-1.5">
        <label
          for="description"
          class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0"
        >
          Deskripsi
        </label>
        <Textarea id="description" v-model="description" rows="3" auto-resize class="w-full" />
      </div>

      <!-- Tautan Referensi -->
      <div class="grid grid-cols-1 gap-1.5">
        <label for="link" class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0">
          Tautan Referensi (Opsional)
        </label>
        <InputText
          id="link"
          v-model="link"
          placeholder="https://..."
          :class="[{ 'p-invalid': errors.link }, 'w-full']"
        />
        <small v-if="errors.link" class="text-red-500 font-medium">{{ errors.link }}</small>
      </div>

      <!-- Upload Gambar -->
      <div class="grid grid-cols-1 gap-1.5">
        <label class="text-[0.95rem] font-semibold text-surface-900 dark:text-surface-0">
          Gambar Produk
        </label>
        <FileUpload
          mode="basic"
          name="image"
          accept="image/*"
          custom-upload
          :auto="false"
          choose-label="Unggah Gambar"
          @select="onFileSelect"
        />
        <small
          v-if="initialData && initialData.image_url"
          class="text-[color:var(--p-text-muted-color)] mt-1"
        >
          * Biarkan kosong jika tidak ingin mengubah gambar.
        </small>
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-8">
      <Button type="button" label="Batal" severity="secondary" @click="handleCancel" />
      <Button type="button" label="Simpan" :loading="loading" @click="handleSave" />
    </div>
  </Dialog>
</template>
