<script setup lang="ts">
import { useProductStore } from "~/stores/product";
import type { Product } from "~/types/product";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ProductList from "~/features/products/components/ProductList.vue";
import ProductForm from "~/features/products/components/ProductForm.vue";

useSeoMeta({
  title: "Katalog",
});

const productStore = useProductStore();
const toast = useToast();
const confirm = useConfirm();

const isFormVisible = ref(false);
const editingProduct = ref<Product | null>(null);
const searchQuery = ref("");

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return productStore.products;
  const query = searchQuery.value.toLowerCase();
  return productStore.products.filter((p) =>
    p.name.toLowerCase().includes(query),
  );
});

onMounted(async () => {
  try {
    await productStore.fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "Gagal Memuat Data",
      detail: error?.message || "Gagal mengambil daftar produk.",
      life: 5000,
    });
  }
});

const openAddForm = () => {
  editingProduct.value = null;
  isFormVisible.value = true;
};

const openEditForm = (product: Product) => {
  editingProduct.value = product;
  isFormVisible.value = true;
};

const handleSave = async (
  name: string,
  price: number,
  description: string | null,
  link: string | null,
  file: File | null,
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
      );
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: "Produk berhasil diperbarui.",
        life: 3000,
      });
    } else {
      await productStore.addProduct(name, price, description, link, file);
      toast.add({
        severity: "success",
        summary: "Berhasil",
        detail: "Produk baru berhasil ditambahkan.",
        life: 3000,
      });
    }
  } catch (error: any) {
    if (error?.message?.includes("row-level security policy")) {
      toast.add({
        severity: "error",
        summary: "Akses Ditolak (RLS)",
        detail: "Supabase menolak operasi. Pastikan RLS Policy sudah diatur.",
        life: 8000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Gagal Menyimpan",
        detail: error?.message || "Terjadi kesalahan tidak terduga.",
        life: 5000,
      });
    }
  }
};

const handleDelete = async (id: number) => {
  confirm.require({
    message: "Apakah Anda yakin ingin menghapus produk ini?",
    header: "Konfirmasi Penghapusan",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Hapus",
    rejectLabel: "Batal",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        await productStore.deleteProduct(id);
        toast.add({
          severity: "success",
          summary: "Terhapus",
          detail: "Produk berhasil dihapus.",
          life: 3000,
        });
      } catch (error: any) {
        toast.add({
          severity: "error",
          summary: "Gagal Menghapus",
          detail: error?.message || "Terjadi kesalahan.",
          life: 5000,
        });
      }
    },
  });
};
</script>

<template>
  <div>
    <!-- Header & Search & Add Button -->
    <div class="flex justify-between items-end mb-10 flex-wrap gap-6">
      <div>
        <h1
          class="m-0 mb-1 text-4xl font-bold tracking-tight text-[color:var(--p-text-color)]"
        >
          Daftar Produk
        </h1>
        <p class="m-0 text-lg text-[color:var(--p-text-muted-color)]">
          Kelola inventaris dan katalog produk Anda secara efisien.
        </p>
      </div>

      <div class="flex gap-4 items-center flex-wrap">
        <IconField iconPosition="left">
          <InputIcon
            class="pi pi-search text-[color:var(--p-text-muted-color)]"
          />
          <InputText
            v-model="searchQuery"
            placeholder="Cari produk..."
            class="w-[280px]"
          />
        </IconField>

        <Button
          label="Tambah Produk"
          icon="pi pi-plus"
          severity="primary"
          @click="openAddForm"
        />
      </div>
    </div>

    <!-- Container for Product List -->
    <ProductList
      :products="filteredProducts"
      :loading="productStore.loading"
      :is-searching="searchQuery.trim().length > 0"
      @edit="openEditForm"
      @delete="handleDelete"
    />

    <!-- Load More Button -->
    <div
      v-if="productStore.hasMore && !searchQuery.trim()"
      class="flex justify-center mt-8 mb-4"
    >
      <Button
        label="Muat Lebih Banyak"
        icon="pi pi-sync"
        :loading="productStore.loading"
        @click="productStore.fetchProducts(true)"
        severity="secondary"
        rounded
      />
    </div>

    <!-- Container for Product Form Modal -->
    <ProductForm
      v-model:visible="isFormVisible"
      :initial-data="editingProduct"
      :loading="productStore.loading"
      @save="handleSave"
    />
  </div>
</template>
