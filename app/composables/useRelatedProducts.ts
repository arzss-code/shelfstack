import { computed, getCurrentInstance, onMounted, ref, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { Product } from '~/types/product'
import { detectProductCategorySlug } from '~/utils/product-specs'
import { CANONICAL_CATEGORIES } from '~/composables/useCategories'

export type RelatedProductsStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface UseRelatedProductsReturn {
  relatedProducts: Ref<Product[]>
  status: Ref<RelatedProductsStatus>
  isLoading: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  errorMessage: Ref<string | null>
  categorySlug: ComputedRef<string | null>
  categoryName: ComputedRef<string>
  viewAllUrl: ComputedRef<string>
  fetchRelated: () => Promise<void>
}

/**
 * Composable untuk memuat dan mengurasi 6 produk terkait berdasarkan kategori produk aktif.
 * Jika kategori produk aktif memiliki kurang dari 6 varian lain, sistem akan melengkapi
 * rekomendasi dengan produk terpopuler/terkurasi lainnya dari katalog.
 */
export function useRelatedProducts(
  productRef: MaybeRefOrGetter<Product | null | undefined>,
): UseRelatedProductsReturn {
  const currentProduct = computed(() => toValue(productRef))
  const relatedProducts = ref<Product[]>([])
  const status = ref<RelatedProductsStatus>(currentProduct.value?.id ? 'loading' : 'idle')
  const errorMessage = ref<string | null>(null)

  const categorySlug = computed<string | null>(() => {
    if (!currentProduct.value) return null
    return detectProductCategorySlug(currentProduct.value)
  })

  const categoryName = computed<string>(() => {
    const slug = categorySlug.value
    if (!slug) return 'Katalog'
    const match = CANONICAL_CATEGORIES.find((c) => c.slug === slug)
    return match ? match.name : 'Katalog'
  })

  const viewAllUrl = computed<string>(() => {
    const slug = categorySlug.value
    if (slug) {
      return `/c/${slug}`
    }
    const catId = currentProduct.value?.category_id
    if (catId) {
      return `/katalog?category=${catId}`
    }
    return '/katalog'
  })

  const fetchRelated = async (): Promise<void> => {
    const targetProduct = currentProduct.value
    if (!targetProduct || !targetProduct.id) {
      relatedProducts.value = []
      status.value = 'idle'
      return
    }

    status.value = 'loading'
    errorMessage.value = null

    try {
      const candidates: Product[] = []
      const targetId = targetProduct.id
      const slug = categorySlug.value
      const catId = targetProduct.category_id

      // 1. Ambil kandidat produk dari kategori yang sama terlebih dahulu
      const queryCategory = slug || catId
      if (queryCategory) {
        const categoryRes = await $fetch<{ status: string; data: Product[] }>('/api/products', {
          params: {
            category: queryCategory,
            limit: 10,
            page: 1,
            sort: 'popular',
          },
        })

        if (categoryRes && Array.isArray(categoryRes.data)) {
          for (const item of categoryRes.data) {
            if (item.id !== targetId && !candidates.some((c) => c.id === item.id)) {
              candidates.push(item)
            }
          }
        }
      }

      // 2. Jika kurang dari 6, lengkapi dengan produk terpopuler di luar kategori
      if (candidates.length < 6) {
        const generalRes = await $fetch<{ status: string; data: Product[] }>('/api/products', {
          params: {
            limit: 12,
            page: 1,
            sort: 'popular',
          },
        })

        if (generalRes && Array.isArray(generalRes.data)) {
          for (const item of generalRes.data) {
            if (item.id !== targetId && !candidates.some((c) => c.id === item.id)) {
              candidates.push(item)
            }
            if (candidates.length >= 6) {
              break
            }
          }
        }
      }

      const finalSelection = candidates.slice(0, 6)
      relatedProducts.value = finalSelection

      if (finalSelection.length === 0) {
        status.value = 'empty'
      } else {
        status.value = 'success'
      }
    } catch (err: unknown) {
      status.value = 'error'
      errorMessage.value =
        err instanceof Error ? err.message : 'Gagal memuat rekomendasi produk terkait'
    }
  }

  // Jika dipanggil di dalam setup komponen, trigger saat mounted
  if (getCurrentInstance()) {
    onMounted(() => {
      fetchRelated()
    })
  }

  // Watcher untuk update saat ID produk berubah (misal navigasi antar produk)
  watch(
    () => toValue(productRef)?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        fetchRelated()
      } else if (!newId) {
        relatedProducts.value = []
        status.value = 'idle'
      }
    },
  )

  return {
    relatedProducts,
    status,
    isLoading: computed(() => status.value === 'loading'),
    isError: computed(() => status.value === 'error'),
    isEmpty: computed(() => status.value === 'empty'),
    errorMessage,
    categorySlug,
    categoryName,
    viewAllUrl,
    fetchRelated,
  }
}
