<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  initialData?: { id: number; name: string; price: number; image_url: string | null } | null
}>()

const emit = defineEmits<{
  save: [name: string, price: number, file: File | null]
  cancel: []
}>()

const visible = defineModel<boolean>('visible', { default: false })

const name = ref('')
const price = ref<number | null>(null)
const imageFile = ref<File | null>(null)

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    name.value = newVal.name
    price.value = newVal.price
  } else {
    name.value = ''
    price.value = null
  }
  imageFile.value = null
}, { immediate: true })

const onFileSelect = (event: any) => {
  imageFile.value = event.files[0]
}

const handleSave = () => {
  if (!name.value || price.value === null) return
  emit('save', name.value, price.value, imageFile.value)
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
        <InputNumber id="price" v-model="price" mode="currency" currency="USD" locale="en-US" />
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
