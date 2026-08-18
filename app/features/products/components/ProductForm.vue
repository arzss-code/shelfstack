<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { compressImage } from "~/utils/image";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi.")
    .max(50, "Nama produk maksimal 50 karakter."),
  price: z
    .number({ message: "Harga wajib diisi." })
    .min(0, "Harga tidak boleh negatif."),
  link: z
    .union([
      z
        .string()
        .url("Format link tidak valid (gunakan http:// atau https://)."),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});

const props = defineProps<{
  initialData?: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    link?: string | null;
    image_url: string | null;
  } | null;
  loading?: boolean;
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
const imageFile = shallowRef<File | null>(null);

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

  const result = productSchema.safeParse({
    name: name.value,
    price: price.value,
    link: link.value,
  });

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof typeof errors.value;
      if (!errors.value[field]) {
        errors.value[field] = issue.message;
      }
    });
    return false;
  }

  return true;
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
    <div class="grid grid-cols-1 gap-4 mt-4 w-full">
      <div class="flex flex-col gap-1.5">
        <label
          for="name"
          class="text-[0.95rem] font-semibold text-[color:var(--p-text-color)]"
          >Nama Produk</label
        >
        <InputText
          id="name"
          v-model="name"
          autofocus
          autocomplete="off"
          :class="[{ 'p-invalid': errors.name }, 'w-full']"
        />
        <small
          v-if="errors.name"
          class="text-[color:var(--p-red-500)] font-medium"
          >{{ errors.name }}</small
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          for="price"
          class="text-[0.95rem] font-semibold text-[color:var(--p-text-color)]"
          >Harga</label
        >
        <InputNumber
          id="price"
          v-model="price"
          mode="currency"
          currency="IDR"
          locale="id-ID"
          class="w-full"
          :class="{ 'p-invalid': errors.price }"
        />
        <small
          v-if="errors.price"
          class="text-[color:var(--p-red-500)] font-medium"
          >{{ errors.price }}</small
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          for="description"
          class="text-[0.95rem] font-semibold text-[color:var(--p-text-color)]"
          >Deskripsi</label
        >
        <Textarea id="description" v-model="description" rows="3" autoResize class="w-full" />
      </div>

      <div class="grid grid-cols-1 gap-1.5">
        <label
          for="link"
          class="text-[0.95rem] font-semibold text-[color:var(--p-text-color)]"
          >Tautan Referensi (Opsional)</label
        >
        <InputText
          id="link"
          v-model="link"
          placeholder="https://..."
          :class="[{ 'p-invalid': errors.link }, 'w-full']"
        />
        <small
          v-if="errors.link"
          class="text-[color:var(--p-red-500)] font-medium"
          >{{ errors.link }}</small
        >
      </div>

      <div class="grid grid-cols-1 gap-1.5">
        <label
          class="text-[0.95rem] font-semibold text-[color:var(--p-text-color)]"
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
          class="text-[color:var(--p-text-muted-color)] mt-1"
          >* Biarkan kosong jika tidak ingin mengubah gambar.</small
        >
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-8">
      <Button
        type="button"
        label="Batal"
        severity="secondary"
        @click="handleCancel"
      ></Button>
      <Button
        type="button"
        label="Simpan"
        @click="handleSave"
        :loading="loading"
      ></Button>
    </div>
  </Dialog>
</template>
