import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'
import type { Product } from '~/types/product'
import { productRepository } from '~/features/products/repository/product'

export const useProductStore = defineStore('product', () => {
  const supabase = useSupabaseClient<Database>()
  const { logActivity } = useActivityLog()
  const products = ref<Product[]>([])
  const deletedProducts = ref<Product[]>([])
  const loading = ref(true)
  const page = ref(1)
  const limit = 12
  const hasMore = ref(true)
  const hasMoreDeleted = ref(true)

  // Fetch
  const fetchProducts = async (isLoadMore = false) => {
    loading.value = true
    try {
      if (!isLoadMore) {
        page.value = 1
      } else {
        page.value += 1
      }

      const from = (page.value - 1) * limit
      const to = from + limit - 1

      const newProducts = await productRepository.getProducts(supabase, from, to)

      if (newProducts.length < limit) {
        hasMore.value = false
      } else {
        hasMore.value = true
      }

      if (isLoadMore) {
        products.value = [...products.value, ...newProducts]
      } else {
        products.value = newProducts
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchAllProducts = async () => {
    loading.value = true
    try {
      const all = await productRepository.getProducts(supabase, 0, 499)
      products.value = all
      hasMore.value = false
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchDeletedProducts = async (isLoadMore = false) => {
    loading.value = true
    try {
      if (!isLoadMore) {
        page.value = 1
      } else {
        page.value += 1
      }

      const from = (page.value - 1) * limit
      const to = from + limit - 1

      const newDeleted = await productRepository.getDeletedProducts(supabase, from, to)

      if (newDeleted.length < limit) {
        hasMoreDeleted.value = false
      } else {
        hasMoreDeleted.value = true
      }

      if (isLoadMore) {
        deletedProducts.value = [...deletedProducts.value, ...newDeleted]
      } else {
        deletedProducts.value = newDeleted
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchAllDeletedProducts = async () => {
    loading.value = true
    try {
      const all = await productRepository.getDeletedProducts(supabase, 0, 499)
      deletedProducts.value = all
      hasMoreDeleted.value = false
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  // Fetch By ID or Slug
  const fetchProductById = async (idOrSlug: number | string): Promise<Product | null> => {
    loading.value = true
    try {
      return await productRepository.getProductById(supabase, idOrSlug)
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  // Add
  const addProduct = async (
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
    stock = 0,
    categoryId: string | null = null,
  ) => {
    loading.value = true
    try {
      let imageUrl = null

      if (file) {
        imageUrl = await productRepository.uploadImage(supabase, file)
      }

      const newProduct = await productRepository.addProduct(supabase, {
        name,
        price,
        description,
        link,
        image_url: imageUrl,
        stock,
        category_id: categoryId,
      })

      if (newProduct) {
        products.value.unshift(newProduct)
        await logActivity({
          entity_type: 'product',
          entity_id: newProduct.id,
          action: 'CREATE',
          description: `Created product "${newProduct.name}"`,
          new_data: newProduct,
        })
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update
  const updateProduct = async (
    id: number,
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
    stock?: number,
    categoryId?: string | null,
  ) => {
    loading.value = true
    try {
      const existing = products.value.find((p) => p.id === id)
      let imageUrl = existing?.image_url || null

      if (file) {
        imageUrl = await productRepository.uploadImage(supabase, file, imageUrl)
      }

      const updatedProduct = await productRepository.updateProduct(supabase, id, {
        name,
        price,
        description,
        link,
        image_url: imageUrl,
        stock: stock !== undefined ? stock : existing?.stock,
        category_id: categoryId !== undefined ? categoryId : existing?.category_id,
      })

      if (updatedProduct) {
        const index = products.value.findIndex((p) => p.id === id)
        if (index !== -1) {
          products.value[index] = updatedProduct
        }
        await logActivity({
          entity_type: 'product',
          entity_id: updatedProduct.id,
          action: 'UPDATE',
          description: `Updated product "${updatedProduct.name}"`,
          old_data: existing,
          new_data: updatedProduct,
        })
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  // Delete (Soft Delete)
  const deleteProduct = async (id: number) => {
    loading.value = true
    try {
      const existing = products.value.find((p) => p.id === id)
      await productRepository.deleteProduct(supabase, id)
      products.value = products.value.filter((p) => p.id !== id)

      if (existing) {
        await logActivity({
          entity_type: 'product',
          entity_id: id,
          action: 'DELETE',
          description: `Deleted product "${existing.name}"`,
          old_data: existing,
        })
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  const restoreProduct = async (id: number) => {
    loading.value = true
    try {
      const existing = deletedProducts.value.find((p) => p.id === id)
      await productRepository.restoreProduct(supabase, id)
      deletedProducts.value = deletedProducts.value.filter((p) => p.id !== id)

      if (existing) {
        await logActivity({
          entity_type: 'product',
          entity_id: id,
          action: 'RESTORE',
          description: `Restored product "${existing.name}"`,
          new_data: existing,
        })
      }
    } catch (e: unknown) {
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    deletedProducts,
    loading,
    hasMore,
    hasMoreDeleted,
    fetchProducts,
    fetchAllProducts,
    fetchDeletedProducts,
    fetchAllDeletedProducts,
    fetchProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
  }
})
