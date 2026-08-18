import { defineStore } from "pinia";
import type { Product } from "~/types/product";
import { productRepository } from "~/repository/product";

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

      const newProducts = await productRepository.getProducts(supabase, from, to);

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
      return await productRepository.getProductById(supabase, id);
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
        imageUrl = await productRepository.uploadImage(supabase, file);
      }

      const newProduct = await productRepository.addProduct(supabase, {
        name,
        price,
        description,
        link,
        image_url: imageUrl,
      });

      if (newProduct) {
        products.value.unshift(newProduct);
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
        imageUrl = await productRepository.uploadImage(supabase, file, imageUrl);
      }

      const updatedProduct = await productRepository.updateProduct(supabase, id, {
        name,
        price,
        description,
        link,
        image_url: imageUrl,
      });

      if (updatedProduct) {
        const index = products.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          products.value[index] = updatedProduct;
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
      await productRepository.deleteProduct(supabase, id);
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
