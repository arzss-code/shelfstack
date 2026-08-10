<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  initialData?: { id: number; name: string; price: number; description?: string | null; link?: string | null; image_url: string | null } | null
}>()

const emit = defineEmits<{
  save: [name: string, price: number, description: string | null, link: string | null, file: File | null]
  cancel: []
}>()

const visible = defineModel<boolean>('visible', { default: false })
const toast = useToast()

const name = ref('')
const price = ref<number | null>(null)
const description = ref<string | null>(null)
const link = ref<string | null>(null)
const imageFile = ref<File | null>(null)

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    name.value = newVal.name
    price.value = newVal.price
    description.value = newVal.description || null
    link.value = newVal.link || null
  } else {
    name.value = ''
    price.value = null
    description.value = null
    link.value = null
  }
  imageFile.value = null
}, { immediate: true })

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        
        let width = img.width
        let height = img.height
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Kita menyimpan hasilnya sebagai WebP sesuai efisiensi modern
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Canvas to Blob failed'))
          }
        }, 'image/webp', 0.7) // Kualitas 70%
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

const onFileSelect = async (event: any) => {
  const file = event.files[0] as File
  if (!file) return

  // 1. Validasi Format
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedFormats.includes(file.type)) {
    toast.add({ severity: 'error', summary: 'Format Ditolak', detail: 'Hanya format JPEG, PNG, dan WebP yang diizinkan sesuai SOP.', life: 5000 })
    // Menghapus pilihan sebelumnya jika ada masalah
    event.options.clear()
    return
  }

  // 2. Validasi Ukuran (Maksimal 5MB)
  const maxSize = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxSize) {
    toast.add({ severity: 'error', summary: 'Ukuran Berlebih', detail: 'Ukuran maksimal file mentah adalah 5 MB.', life: 5000 })
    event.options.clear()
    return
  }

  // 3. Kompresi Sisi Klien
  try {
    const compressed = await compressImage(file)
    imageFile.value = compressed
    toast.add({ severity: 'success', summary: 'Kompresi Berhasil', detail: `File siap diunggah. Ukuran akhir: ${(compressed.size / 1024).toFixed(2)} KB`, life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal Memproses', detail: 'Terjadi kesalahan saat memproses gambar.', life: 5000 })
    console.error(error)
  }
}

const handleSave = () => {
  if (!name.value || price.value === null) return
  emit('save', name.value, price.value, description.value, link.value, imageFile.value)
  visible.value = false
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="initialData ? 'Edit Produk' : 'Tambah Produk'" :style="{ width: '30rem' }">
    <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="name" style="font-weight: 600;">Nama Produk</label>
        <InputText id="name" v-model="name" autofocus autocomplete="off" />
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="price" style="font-weight: 600;">Harga</label>
        <InputNumber id="price" v-model="price" mode="currency" currency="IDR" locale="id-ID" />
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="description" style="font-weight: 600;">Deskripsi</label>
        <Textarea id="description" v-model="description" rows="3" autoResize />
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="link" style="font-weight: 600;">Link Referensi</label>
        <InputText id="link" v-model="link" placeholder="https://..." />
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label style="font-weight: 600;">Gambar Produk</label>
        <FileUpload mode="basic" name="image" accept="image/*" customUpload @select="onFileSelect" :auto="false" chooseLabel="Pilih Gambar" />
        <small v-if="initialData && initialData.image_url" style="color: var(--p-text-muted-color);">* Biarkan kosong jika tidak ingin mengubah gambar saat ini.</small>
      </div>
    </div>
    
    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 2rem;">
        <Button type="button" label="Batal" severity="secondary" @click="handleCancel"></Button>
        <Button type="button" label="Simpan" @click="handleSave" :disabled="!name || price === null"></Button>
    </div>
  </Dialog>
</template>
