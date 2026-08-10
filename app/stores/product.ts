import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Product {
  id: number
  name: string
  price: number
  image_url: string | null
}

export const useProductStore = defineStore('product', () => {
  const supabase = useSupabaseClient()
  const products = ref<Product[]>([])
  const loading = ref(false)

  // Fetch
  const fetchProducts = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false })
      
      if (error) throw error
      products.value = data || []
    } catch (e) {
      console.error("Error fetching products:", e)
    } finally {
      loading.value = false
    }
  }

  // Add
  const addProduct = async (name: string, price: number, file: File | null) => {
    loading.value = true
    try {
      let imageUrl = null

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrlData.publicUrl
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{ name, price, image_url: imageUrl }])
        .select()
        .single()
      
      if (error) throw error
      
      if (data) {
        products.value.unshift(data as Product)
      }
    } catch (e) {
      console.error("Error adding product:", e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update
  const updateProduct = async (id: number, name: string, price: number, file: File | null) => {
     loading.value = true
     try {
       const existing = products.value.find(p => p.id === id)
       let imageUrl = existing?.image_url || null

       if (file) {
         const fileExt = file.name.split('.').pop()
         const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
         const { error: uploadError } = await supabase.storage
           .from('product-images')
           .upload(fileName, file)
         
         if (uploadError) throw uploadError

         const { data: publicUrlData } = supabase.storage
           .from('product-images')
           .getPublicUrl(fileName)
         
         imageUrl = publicUrlData.publicUrl
       }

       const { data, error } = await supabase
         .from('products')
         .update({ name, price, image_url: imageUrl })
         .eq('id', id)
         .select()
         .single()
       
       if (error) throw error
       
       if (data) {
         const index = products.value.findIndex(p => p.id === id)
         if (index !== -1) {
           products.value[index] = data as Product
         }
       }
     } catch (e) {
       console.error("Error updating product:", e)
       throw e
     } finally {
       loading.value = false
     }
  }

  // Delete
  const deleteProduct = async (id: number) => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      products.value = products.value.filter(p => p.id !== id)
    } catch (e) {
      console.error("Error deleting product:", e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  }
})
