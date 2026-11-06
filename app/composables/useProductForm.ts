import type { Ref } from 'vue'
import { productFormSchema } from '~~/shared/schemas/product'
import { compressImage } from '~/utils/image'
import { useCategories } from '~/composables/useCategories'

export interface ProductFormInitialData {
  id: number
  name: string
  price: number
  description?: string | null
  link?: string | null
  image_url: string | null
  stock?: number
  category_id?: string | null
}

export interface ProductFormSavePayload {
  name: string
  price: number
  description: string | null
  link: string | null
  file: File | null
  stock: number
  categoryId: string | null
}

export function useProductForm(
  getInitialData: () => ProductFormInitialData | null | undefined,
  visible: Ref<boolean>,
  callbacks: {
    onSave: (payload: ProductFormSavePayload) => void
    onCancel: () => void
  },
) {
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
    description?: string
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

  const categorySelectOptions = computed(() => [
    { value: '', label: 'Pilih Kategori' },
    ...categories.value.map((cat) => ({ value: String(cat.id), label: cat.name })),
  ])

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
    getInitialData()?.image_url ? '* Biarkan kosong jika tidak ingin mengubah gambar.' : '',
  )

  onMounted(() => {
    fetchCategories()
  })

  watch(
    getInitialData,
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
      description: description.value,
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
    callbacks.onSave({
      name: name.value,
      price: price.value as number,
      description: description.value,
      link: link.value,
      file: imageFile.value,
      stock: stock.value,
      categoryId: categoryId.value || null,
    })
    visible.value = false
  }

  const handleCancel = () => {
    callbacks.onCancel()
    visible.value = false
  }

  return {
    name,
    selectedFile,
    errors,
    priceModel,
    stockModel,
    categoryIdModel,
    categorySelectOptions,
    linkModel,
    descriptionModel,
    imageHint,
    onFileReject,
    handleSave,
    handleCancel,
  }
}
