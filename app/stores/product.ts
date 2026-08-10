import { defineStore } from "pinia";
import type { Product } from "~/types/product";

export const useProductStore = defineStore("product", () => {
  const supabase = useSupabaseClient<any>();
  const products = ref<Product[]>([]);
  const loading = ref(true);
  const page = ref(1);
  const limit = 12;
  const hasMore = ref(true);

  // Fetch
  const fetchProducts = async (isLoadMore = false) => {
    loading.value = true;
    try {
      if (!isLoadMore) {
        page.value = 1;
      } else {
        page.value += 1;
      }

      const from = (page.value - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("id", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newProducts = data || [];
      if (newProducts.length < limit) {
        hasMore.value = false;
      } else {
        hasMore.value = true;
      }

      if (isLoadMore) {
        products.value = [...products.value, ...newProducts];
      } else {
        products.value = newProducts;
      }
    } catch (e) {
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Fetch By ID
  const fetchProductById = async (id: number): Promise<Product | null> => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (e) {
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Add
  const addProduct = async (
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
  ) => {
    loading.value = true;
    try {
      let imageUrl = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("products")
        .insert([{ name, price, description, link, image_url: imageUrl }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        products.value.unshift(data as Product);
      }
    } catch (e) {
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Update
  const updateProduct = async (
    id: number,
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
  ) => {
    loading.value = true;
    try {
      const existing = products.value.find((p) => p.id === id);
      let imageUrl = existing?.image_url || null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `images/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;

        // Cleanup old image if exists
        if (existing?.image_url) {
          const oldPath = existing.image_url.split("/product-images/")[1];
          if (oldPath) {
            await supabase.storage.from("product-images").remove([oldPath]);
          }
        }
      }

      const { data, error } = await supabase
        .from("products")
        .update({ name, price, description, link, image_url: imageUrl })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const index = products.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          products.value[index] = data as Product;
        }
      }
    } catch (e) {
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Delete (Soft Delete)
  const deleteProduct = async (id: number) => {
    loading.value = true;
    try {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      products.value = products.value.filter((p) => p.id !== id);
    } catch (e) {
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    loading,
    hasMore,
    fetchProducts,
    fetchProductById,
    addProduct,
    updateProduct,
    deleteProduct,
  };
});
