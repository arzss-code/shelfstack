import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { Product } from '~/types/product'

type TypedClient = SupabaseClient<Database>

interface ProductPayload {
  name: string
  price: number
  description: string | null
  link: string | null
  image_url: string | null
  stock?: number
  category_id?: string | null
}

export const productRepository = {
  async getProducts(supabase: TypedClient, from: number, to: number) {
    const response = await $fetch<{ status: string; data: Product[] }>('/api/products', {
      params: { from, to },
    })
    return response.data
  },

  async getDeletedProducts(supabase: TypedClient, from: number, to: number) {
    const response = await $fetch<{ status: string; data: Product[] }>('/api/products/deleted', {
      params: { from, to },
    })
    return response.data
  },

  async getProductById(supabase: TypedClient, id: number | string) {
    const response = await $fetch<{ status: string; data: Product }>(`/api/products/${id}`)
    return response.data
  },

  async addProduct(supabase: TypedClient, product: ProductPayload) {
    const response = await $fetch<{ status: string; data: Product }>('/api/products', {
      method: 'POST',
      body: product,
    })
    return response.data
  },

  async updateProduct(supabase: TypedClient, id: number, product: ProductPayload) {
    const response = await $fetch<{ status: string; data: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: product,
    })
    return response.data
  },

  async deleteProduct(supabase: TypedClient, id: number) {
    await $fetch(`/api/products/${id}`, {
      method: 'DELETE',
    })
    return true
  },

  async restoreProduct(supabase: TypedClient, id: number) {
    await $fetch(`/api/products/${id}/restore`, {
      method: 'PUT',
    })
    return true
  },

  async uploadImage(supabase: TypedClient, file: File, existingImageUrl?: string | null) {
    const fileExt = file.name.split('.').pop()
    const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName)

    const newImageUrl = publicUrlData.publicUrl

    // Cleanup old image if exists
    if (existingImageUrl) {
      const oldPath = existingImageUrl.split('/product-images/')[1]
      if (oldPath) {
        await supabase.storage.from('product-images').remove([oldPath])
      }
    }

    return newImageUrl
  },
}
