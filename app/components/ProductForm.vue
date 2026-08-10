<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const props = defineProps<{
  initialData?: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    link?: string | null;
    image_url: string | null;
  } | null;
}>();

const emit = defineEmits<{
  save: [
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
  ];
  cancel: [];
}>();

const visible = defineModel<boolean>("visible", { default: false });
const toast = useToast();

const name = ref("");
const price = ref<number | null>(null);
const description = ref<string | null>(null);
const link = ref<string | null>(null);
const imageFile = ref<File | null>(null);

const errors = ref<{ name?: string; price?: string; link?: string }>({});

watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      name.value = newVal.name;
      price.value = newVal.price;
      description.value = newVal.description || null;
      link.value = newVal.link || null;
    } else {
      name.value = "";
      price.value = null;
      description.value = null;
      link.value = null;
    }
    imageFile.value = null;
    errors.value = {};
  },
  { immediate: true },
);

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                },
              );
              resolve(compressedFile);
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          },
          "image/webp",
          0.7,
        ); // Kualitas 70%
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const onFileSelect = async (event: any) => {
  const file = event.files[0] as File;
  if (!file) return;

  // 1. Validasi Format
  const allowedFormats = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedFormats.includes(file.type)) {
    toast.add({
      severity: "error",
      summary: "Format Ditolak",
      detail: "Hanya format JPEG, PNG, dan WebP yang diizinkan sesuai SOP.",
      life: 5000,
    });
    // Menghapus pilihan sebelumnya jika ada masalah
    event.options.clear();
    return;
  }

  // 2. Validasi Ukuran (Maksimal 5MB)
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    toast.add({
      severity: "error",
      summary: "Ukuran Berlebih",
      detail: "Ukuran maksimal file mentah adalah 5 MB.",
      life: 5000,
    });
    event.options.clear();
    return;
  }

  // 3. Kompresi Sisi Klien
  try {
    const compressed = await compressImage(file);
    imageFile.value = compressed;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Gagal Memproses",
      detail: "Terjadi kesalahan saat memproses gambar.",
      life: 5000,
    });
  }
};

const validateForm = (): boolean => {
  errors.value = {};

  if (!name.value || name.value.trim() === "") {
    errors.value.name = "Nama produk wajib diisi.";
  } else if (name.value.length > 50) {
    errors.value.name = "Nama produk maksimal 50 karakter.";
  }

  if (price.value === null || price.value === undefined) {
    errors.value.price = "Harga wajib diisi.";
  } else if (price.value < 0) {
    errors.value.price = "Harga tidak boleh negatif.";
  }

  if (link.value) {
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(link.value)) {
      errors.value.link =
        "Format link tidak valid (gunakan http:// atau https://).";
    }
  }

  return Object.keys(errors.value).length === 0;
};

const handleSave = () => {
  if (!validateForm()) return;
  emit(
    "save",
    name.value,
    price.value as number,
    description.value,
    link.value,
    imageFile.value,
  );
  visible.value = false;
};

const handleCancel = () => {
  emit("cancel");
  visible.value = false;
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="initialData ? 'Edit Produk' : 'Tambah Produk'"
    :style="{ width: '30rem' }"
  >
    <div
      style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem"
    >
      <div style="display: flex; flex-direction: column; gap: 0.35rem">
        <label
          for="name"
          style="
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--p-text-color);
          "
          >Nama Produk</label
        >
        <InputText
          id="name"
          v-model="name"
          autofocus
          autocomplete="off"
          :class="{ 'p-invalid': errors.name }"
        />
        <small
          v-if="errors.name"
          style="color: var(--p-red-500); font-weight: 500"
          >{{ errors.name }}</small
        >
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.35rem">
        <label
          for="price"
          style="
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--p-text-color);
          "
          >Harga</label
        >
        <InputNumber
          id="price"
          v-model="price"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          :class="{ 'p-invalid': errors.price }"
        />
        <small
          v-if="errors.price"
          style="color: var(--p-red-500); font-weight: 500"
          >{{ errors.price }}</small
        >
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.35rem">
        <label
          for="description"
          style="
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--p-text-color);
          "
          >Deskripsi</label
        >
        <Textarea id="description" v-model="description" rows="3" autoResize />
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.35rem">
        <label
          for="link"
          style="
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--p-text-color);
          "
          >Tautan Referensi (Opsional)</label
        >
        <InputText
          id="link"
          v-model="link"
          placeholder="https://..."
          :class="{ 'p-invalid': errors.link }"
        />
        <small
          v-if="errors.link"
          style="color: var(--p-red-500); font-weight: 500"
          >{{ errors.link }}</small
        >
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.35rem">
        <label
          style="
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--p-text-color);
          "
          >Gambar Produk</label
        >
        <FileUpload
          mode="basic"
          name="image"
          accept="image/*"
          customUpload
          @select="onFileSelect"
          :auto="false"
          chooseLabel="Unggah Gambar"
        />
        <small
          v-if="initialData && initialData.image_url"
          style="color: var(--p-text-muted-color); margin-top: 0.25rem"
          >* Biarkan kosong jika tidak ingin mengubah gambar.</small
        >
      </div>
    </div>

    <div
      style="
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 2rem;
      "
    >
      <Button
        type="button"
        label="Batal"
        severity="secondary"
        @click="handleCancel"
      ></Button>
      <Button type="button" label="Simpan" @click="handleSave"></Button>
    </div>
  </Dialog>
</template>
