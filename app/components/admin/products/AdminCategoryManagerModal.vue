<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useCategories, type CategoryItem } from '~/composables/useCategories'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const { categories, fetchCategories } = useCategories()
const toast = useUiToast()

const isVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit('close')
  },
})

const saving = ref(false)
const deletingId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const editingId = ref<string | null>(null)
const slugTouched = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  display_order: '0',
  image_url: '',
})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(
  () => form.name,
  (val) => {
    if (!editingId.value && !slugTouched.value) {
      form.slug = slugify(val)
    }
  },
)

watch(
  () => props.show,
  (open) => {
    if (open) {
      errorMsg.value = null
      fetchCategories().catch(() => {})
    }
  },
)

function resetForm() {
  editingId.value = null
  slugTouched.value = false
  form.name = ''
  form.slug = ''
  form.description = ''
  form.display_order = String((categories.value.length || 0) + 1)
  form.image_url = ''
}

function startEdit(cat: CategoryItem) {
  editingId.value = cat.id
  slugTouched.value = true
  form.name = cat.name
  form.slug = cat.slug
  form.description = cat.description || ''
  form.display_order = String(cat.display_order ?? 0)
  form.image_url = cat.image_url || ''
}

async function submitCategory() {
  saving.value = true
  errorMsg.value = null
  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim() || null,
      display_order: Number.parseInt(form.display_order || '0', 10) || 0,
      image_url: form.image_url.trim() || null,
    }
    if (editingId.value) {
      await $fetch(`/api/admin/categories/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      })
      toast.show({ title: 'Berhasil', message: 'Kategori berhasil diperbarui.', tone: 'success' })
    } else {
      await $fetch('/api/admin/categories', {
        method: 'POST',
        body: payload,
      })
      toast.show({
        title: 'Berhasil',
        message: 'Kategori baru berhasil ditambahkan.',
        tone: 'success',
      })
    }
    resetForm()
    await fetchCategories()
    emit('updated')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || 'Gagal menyimpan kategori.'
  } finally {
    saving.value = false
  }
}

async function deleteCategory(cat: CategoryItem) {
  deletingId.value = cat.id
  errorMsg.value = null
  try {
    await $fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    toast.show({ title: 'Diarsipkan', message: `Kategori "${cat.name}" dihapus.`, tone: 'success' })
    await fetchCategories()
    emit('updated')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || 'Gagal menghapus kategori.'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <UiModal
    v-model:visible="isVisible"
    size="lg"
    title="Kelola Kategori Katalog"
    description="Tambah, ubah urutan, atau arsipkan kategori resmi etalase ShelfStack."
  >
    <div class="space-y-5">
      <UiAlert v-if="errorMsg" tone="danger" class="text-xs">{{ errorMsg }}</UiAlert>

      <form
        class="rounded-card border border-brand-hair bg-brand-canvas-soft p-4 space-y-3"
        @submit.prevent="submitCategory"
      >
        <div class="flex items-center justify-between gap-2">
          <h4 class="m-0 font-display text-sm font-bold text-brand-ink">
            {{ editingId ? 'Edit Kategori' : 'Tambah Kategori Baru' }}
          </h4>
          <UiButton v-if="editingId" type="button" variant="ghost" size="sm" @click="resetForm">
            Batal Edit
          </UiButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UiInput
            v-model="form.name"
            label="Nama Kategori"
            placeholder="Audio & Meja Kerja"
            size="sm"
          />
          <UiInput
            v-model="form.slug"
            label="Slug URL"
            placeholder="audio-meja-kerja"
            size="sm"
            @input="slugTouched = true"
          />
          <UiInput
            v-model="form.display_order"
            label="Urutan Tampil"
            type="number"
            numeric
            :min="0"
            size="sm"
          />
          <UiInput
            v-model="form.image_url"
            label="Path / URL Gambar (Opsional)"
            placeholder="/logo.svg"
            size="sm"
          />
        </div>

        <UiTextarea
          v-model="form.description"
          label="Deskripsi Singkat"
          placeholder="Ringkasan produk dalam kategori ini"
          :rows="2"
        />

        <div class="flex justify-end">
          <UiButton type="submit" variant="primary" size="sm" :loading="saving">
            {{ editingId ? 'Simpan Kategori' : 'Tambah Kategori' }}
          </UiButton>
        </div>
      </form>

      <div class="divide-y divide-brand-hairsoft border border-brand-hair rounded-card">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-brand-canvas"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-sm text-brand-ink">{{ cat.name }}</span>
              <span
                class="rounded border border-brand-hair bg-brand-field px-2 py-0.5 text-xs text-brand-muted"
              >
                /c/{{ cat.slug }}
              </span>
              <span class="text-xs text-brand-muted">Urutan: {{ cat.display_order ?? 0 }}</span>
            </div>
            <p v-if="cat.description" class="m-0 mt-1 text-xs text-brand-muted line-clamp-1">
              {{ cat.description }}
            </p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <UiButton size="sm" variant="secondary" @click="startEdit(cat)">Edit</UiButton>
            <UiButton
              size="sm"
              variant="danger"
              :loading="deletingId === cat.id"
              @click="deleteCategory(cat)"
            >
              Hapus
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>
