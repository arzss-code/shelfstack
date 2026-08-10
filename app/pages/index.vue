<script setup lang="ts">
import { useProductStore, type Product } from "~/stores/product";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

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
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        gap: 1.5rem;
      "
    >
      <div>
        <h1
          style="
            margin: 0 0 0.25rem 0;
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--p-text-color);
            letter-spacing: -0.03em;
          "
        >
          Daftar Produk
        </h1>
        <p
          style="
            margin: 0;
            color: var(--p-text-muted-color);
            font-size: 1.05rem;
          "
        >
          Kelola inventaris dan katalog produk Anda secara efisien.
        </p>
      </div>

      <div
        style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap"
      >
        <IconField iconPosition="left">
          <InputIcon
            class="pi pi-search"
            style="color: var(--p-text-muted-color)"
          />
          <InputText
            v-model="searchQuery"
            placeholder="Cari produk..."
            style="width: 280px"
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

    <!-- Container for Product Form Modal -->
    <ProductForm
      v-model:visible="isFormVisible"
      :initial-data="editingProduct"
      @save="handleSave"
    />
  </div>
</template>
