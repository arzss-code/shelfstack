<script setup lang="ts">
export interface DemoCredentialPayload {
  email: string
  role: 'customer' | 'admin'
}

const emit = defineEmits<{
  selectDemo: [payload: DemoCredentialPayload]
}>()

const activeRole = ref<'customer' | 'admin' | null>(null)

function selectRole(role: 'customer' | 'admin') {
  activeRole.value = role
  const email = role === 'admin' ? 'admin@shelfstack.local' : 'customer@shelfstack.local'
  emit('selectDemo', { email, role })
}
</script>

<template>
  <div
    role="region"
    aria-label="Akses Cepat Kredensial Demo"
    class="mb-4 rounded-xl border border-brand-hair bg-brand-canvas-soft p-3.5 text-xs transition-colors"
  >
    <div class="mb-2.5 flex items-center justify-between">
      <div class="flex items-center gap-1.5 font-medium text-brand-ink">
        <i class="pi pi-bolt text-xs text-brand-accent" aria-hidden="true" />
        <span class="font-semibold">Kredensial Demo 1-Klik</span>
      </div>
      <span class="text-[10px] text-brand-muted">Pengujian Portofolio</span>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="flex flex-col items-start gap-0.5 rounded-lg border p-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        :class="[
          activeRole === 'customer'
            ? 'border-brand-accent bg-brand-canvas text-brand-ink shadow-whisper'
            : 'border-brand-hairsoft bg-white text-brand-muted hover:border-brand-hair hover:text-brand-ink',
        ]"
        aria-label="Pilih akun demo pelanggan: customer@shelfstack.local"
        @click="selectRole('customer')"
      >
        <div class="flex items-center justify-between w-full">
          <span class="text-xs font-semibold text-brand-ink">Pelanggan</span>
          <span
            class="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider"
            :class="
              activeRole === 'customer'
                ? 'bg-brand-accent/10 text-brand-accent'
                : 'bg-brand-hairsoft text-brand-muted'
            "
          >
            Buyer
          </span>
        </div>
        <span class="font-mono text-[10px] text-brand-muted truncate w-full">
          customer@shelfstack.local
        </span>
      </button>

      <button
        type="button"
        class="flex flex-col items-start gap-0.5 rounded-lg border p-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        :class="[
          activeRole === 'admin'
            ? 'border-brand-accent bg-brand-canvas text-brand-ink shadow-whisper'
            : 'border-brand-hairsoft bg-white text-brand-muted hover:border-brand-hair hover:text-brand-ink',
        ]"
        aria-label="Pilih akun demo admin: admin@shelfstack.local"
        @click="selectRole('admin')"
      >
        <div class="flex items-center justify-between w-full">
          <span class="text-xs font-semibold text-brand-ink">Admin Ops</span>
          <span
            class="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider"
            :class="
              activeRole === 'admin'
                ? 'bg-amber-500/10 text-amber-700'
                : 'bg-brand-hairsoft text-brand-muted'
            "
          >
            Staff
          </span>
        </div>
        <span class="font-mono text-[10px] text-brand-muted truncate w-full">
          admin@shelfstack.local
        </span>
      </button>
    </div>
  </div>
</template>
