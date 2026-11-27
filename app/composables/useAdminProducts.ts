import { ref, computed, watch, onMounted } from 'vue'
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import { sortProducts, type SortDir, type SortKey } from '~/features/products/utils/product-sort'
import { useUiToast } from '~/composables/useUiToast'
import { useUiConfirm } from '~/composables/useUiConfirm'

export function useAdminProducts() {
  const route = useRoute()
  const productStore = useProductStore()
  const toast = useUiToast()
  const confirm = useUiConfirm()

  const isFormVisible = ref(false)
  const editingProduct = ref<Product | null>(null)
  const isStockModalVisible = ref(false)
  const stockAuditProduct = ref<Product | null>(null)
  const isVariantModalVisible = ref(false)
  const variantProduct = ref<Product | null>(null)
  const isCategoryModalVisible = ref(false)
  const searchQuery = ref('')
  const activeTab = ref(
    route.query.tab === 'critical' ? '2' : route.query.tab === 'trash' ? '1' : '0',
  )
  const sortOption = ref('name-asc')
  const viewMode = ref<'grid' | 'table'>('grid')

  const PRODUCT_VIEW_STORAGE_KEY = 'shelfstack-admin-products-view'

  const ensureFullTableDataset = async () => {
    if (viewMode.value !== 'table') return
    try {
      if (activeTab.value === '1') {
        if (productStore.hasMoreDeleted || productStore.deletedProducts.length === 0) {
          await productStore.fetchAllDeletedProducts()
        }
      } else if (productStore.hasMore || productStore.products.length === 0) {
        await productStore.fetchAllProducts()
      }
    } catch {
      // Tetap gunakan data tercached jika reload penuh gagal
    }
  }

  const setViewMode = (mode: 'grid' | 'table') => {
    viewMode.value = mode
    if (import.meta.client) {
      try {
        localStorage.setItem(PRODUCT_VIEW_STORAGE_KEY, mode)
      } catch {
        // Abaikan jika storage diblokir browser
      }
    }
    if (mode === 'table') {
      void ensureFullTableDataset()
    }
  }

  const resetProductFilters = () => {
    searchQuery.value = ''
    sortOption.value = 'name-asc'
  }

  const sortOptionsList = [
    { value: 'name-asc', label: 'Nama A-Z' },
    { value: 'price-asc', label: 'Termurah' },
    { value: 'price-desc', label: 'Termahal' },
    { value: 'stock-asc', label: 'Stok tersedikit' },
  ]

  const openStockMovements = (product: Product) => {
    stockAuditProduct.value = product
    isStockModalVisible.value = true
  }

  const openVariantsModal = (product: Product) => {
    variantProduct.value = product
    isVariantModalVisible.value = true
  }

  const openCategoryManagerModal = () => {
    isCategoryModalVisible.value = true
  }

  const criticalStockProducts = computed(() =>
    productStore.products.filter((p) => (p.stock ?? 0) < 5),
  )

  const tabItems = computed(() => [
    { value: '0', label: 'Produk Aktif' },
    {
      value: '2',
      label: 'Stok Kritis',
      count: criticalStockProducts.value.length,
      countTone: 'danger' as const,
    },
    { value: '1', label: 'Keranjang Sampah' },
  ])

  const filteredProducts = computed(() => {
    const src =
      activeTab.value === '1'
        ? productStore.deletedProducts
        : activeTab.value === '2'
          ? criticalStockProducts.value
          : productStore.products
    const q = searchQuery.value.trim().toLowerCase()
    const list = !q ? src : src.filter((p) => p.name.toLowerCase().includes(q))
    const [k, d] = sortOption.value.split('-') as [SortKey, SortDir]
    return sortProducts(list, k, d)
  })

  watch(activeTab, async (newVal) => {
    if (newVal === '1') {
      if (viewMode.value === 'table' && productStore.hasMoreDeleted) {
        await ensureFullTableDataset()
        return
      }
      if (productStore.deletedProducts.length === 0) {
        try {
          await productStore.fetchDeletedProducts()
        } catch {
          toast.show({
            title: 'Error',
            message: 'Gagal memuat keranjang sampah',
            tone: 'error',
          })
        }
      }
    }
  })

  onMounted(async () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(PRODUCT_VIEW_STORAGE_KEY)
        if (saved === 'grid' || saved === 'table') {
          viewMode.value = saved
        }
      } catch {
        // Abaikan jika storage tidak tersedia
      }
    }
    try {
      if (viewMode.value === 'table') {
        await productStore.fetchAllProducts()
      } else {
        await productStore.fetchProducts()
      }
    } catch (error: unknown) {
      toast.show({
        title: 'Gagal Memuat Data',
        message: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
        tone: 'error',
      })
    }
  })

  const openAddForm = () => {
    editingProduct.value = null
    isFormVisible.value = true
  }

  const openEditForm = (product: Product) => {
    editingProduct.value = product
    isFormVisible.value = true
  }

  const handleSave = async (
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
    stock = 0,
    categoryId: string | null = null,
  ) => {
    try {
      if (editingProduct.value) {
        await productStore.updateProduct(
          editingProduct.value.id,
          name,
          price,
          description,
          link,
          file,
          stock,
          categoryId,
        )
        toast.show({
          title: 'Berhasil',
          message: 'Produk berhasil diperbarui.',
          tone: 'success',
        })
      } else {
        await productStore.addProduct(name, price, description, link, file, stock, categoryId)
        toast.show({
          title: 'Berhasil',
          message: 'Produk baru berhasil ditambahkan.',
          tone: 'success',
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
      const isRls = message.includes('row-level security policy')
      toast.show({
        title: isRls ? 'Akses Ditolak (RLS)' : 'Gagal Menyimpan',
        message: isRls ? 'Supabase menolak operasi. Pastikan RLS Policy sudah diatur.' : message,
        tone: 'error',
      })
    }
  }

  const handleDelete = async (id: number) => {
    confirm.require({
      message: 'Apakah Anda yakin ingin menghapus produk ini?',
      header: 'Konfirmasi Penghapusan',
      tone: 'danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await productStore.deleteProduct(id)
          toast.show({
            title: 'Terhapus',
            message: 'Produk berhasil dihapus.',
            tone: 'success',
          })
        } catch (error: unknown) {
          toast.show({
            title: 'Gagal Menghapus',
            message: error instanceof Error ? error.message : 'Terjadi kesalahan.',
            tone: 'error',
          })
        }
      },
    })
  }

  const handleRestore = async (id: number) => {
    confirm.require({
      message: 'Apakah Anda yakin ingin mengembalikan produk ini dari keranjang sampah?',
      header: 'Konfirmasi Restore',
      tone: 'success',
      acceptLabel: 'Restore',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await productStore.restoreProduct(id)
          toast.show({
            title: 'Berhasil',
            message: 'Produk berhasil dikembalikan.',
            tone: 'success',
          })
          productStore.fetchProducts()
        } catch (error: unknown) {
          toast.show({
            title: 'Gagal Mengembalikan',
            message: error instanceof Error ? error.message : 'Terjadi kesalahan.',
            tone: 'error',
          })
        }
      },
    })
  }

  return {
    productStore,
    isFormVisible,
    editingProduct,
    isStockModalVisible,
    stockAuditProduct,
    isVariantModalVisible,
    variantProduct,
    isCategoryModalVisible,
    searchQuery,
    activeTab,
    sortOption,
    viewMode,
    sortOptionsList,
    tabItems,
    filteredProducts,
    setViewMode,
    resetProductFilters,
    openStockMovements,
    openVariantsModal,
    openCategoryManagerModal,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    handleRestore,
  }
}
