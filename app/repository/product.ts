import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '~/types/product'

export const productRepository = {
  async getProducts(supabase: SupabaseClient, from: number, to: number) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('id', { ascending: false })
      .range(from, to)

    if (error) throw error
    return data as Product[]
  },

  async getProductById(supabase: SupabaseClient, id: number) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Product
  },

  async addProduct(
    supabase: SupabaseClient,
    product: { name: string; price: number; description: string | null; link: string | null; image_url: string | null }
  ) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  async updateProduct(
    supabase: SupabaseClient,
    id: number,
    product: { name: string; price: number; description: string | null; link: string | null; image_url: string | null }
  ) {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  async deleteProduct(supabase: SupabaseClient, id: number) {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  },

  async uploadImage(supabase: SupabaseClient, file: File, existingImageUrl?: string | null) {
    const fileExt = file.name.split('.').pop()
    const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    const newImageUrl = publicUrlData.publicUrl

    // Cleanup old image if exists
    if (existingImageUrl) {
      const oldPath = existingImageUrl.split('/product-images/')[1]
      if (oldPath) {
        await supabase.storage.from('product-images').remove([oldPath])
      }
    }

    return newImageUrl
  }
}
