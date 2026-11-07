<script setup lang="ts">
export interface DemoCredentialPayload {
  email: string
  role: 'customer' | 'admin'
}

const emit = defineEmits<{
  selectDemo: [payload: DemoCredentialPayload]
}>()

const selectedRole = ref<'customer' | 'admin' | null>(null)

function selectRole(role: 'customer' | 'admin') {
  selectedRole.value = role
  const email = role === 'admin' ? 'demo-admin@shelfstack.local' : 'demo-customer@shelfstack.local'
  emit('selectDemo', { email, role })
}
</script>

<template>
  <div
    role="region"
    aria-label="Akses Cepat Kredensial Demo"
    class="mb-4 rounded-xl border border-brand-hair bg-brand-canvas-soft p-2.5 text-xs transition-all"
  >
    <!-- Header Bar: Purpose & Transparent Password Hint -->
    <div
      class="flex items-center justify-between gap-2 pb-2 border-b border-brand-hairsoft/80 text-[11px]"
    >
      <span class="font-medium text-brand-ink flex items-center gap-1.5">
        <i class="pi pi-key text-[10px] text-brand-muted" aria-hidden="true" />
        <span class="font-semibold">Akun Pengujian Demo</span>
      </span>
      <span
        class="text-[10px] text-brand-muted font-mono bg-brand-canvas px-1.5 py-0.5 rounded border border-brand-hairsoft tabular-nums"
        title="Kata sandi otomatis terisi saat akun dipilih"
      >
        Sandi: Password123!
      </span>
    </div>

    <!-- Compact Selector Grid (44px min tap target compliant) -->
    <div class="grid grid-cols-2 gap-1.5 pt-2">
      <!-- Role: Pelanggan (Buyer) -->
      <button
        type="button"
        class="group relative flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 min-h-[44px]"
        :class="[
          selectedRole === 'customer'
            ? 'border-brand-ink bg-white shadow-whisper text-brand-ink'
            : 'border-brand-hairsoft bg-white/70 hover:bg-white hover:border-brand-hair text-brand-muted',
        ]"
        aria-label="Gunakan akun demo pelanggan: demo-customer@shelfstack.local"
        @click="selectRole('customer')"
      >
        <div class="min-w-0 pr-1">
          <div class="flex items-center gap-1">
            <span
              class="font-semibold text-xs leading-none"
              :class="selectedRole === 'customer' ? 'text-brand-ink' : 'text-brand-ink/90'"
            >
              Pelanggan
            </span>
            <span
              v-if="selectedRole === 'customer'"
              class="inline-flex items-center text-[9px] font-bold text-brand-success"
              aria-label="Akun terpilih"
            >
              <i class="pi pi-check text-[8px]" aria-hidden="true" />
            </span>
          </div>
          <p class="text-[10px] text-brand-muted truncate m-0 mt-0.5">Etalase &amp; Checkout</p>
        </div>
        <span
          class="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors"
          :class="
            selectedRole === 'customer'
              ? 'bg-brand-canvas-soft text-brand-ink'
              : 'text-brand-muted/70 group-hover:text-brand-muted'
          "
        >
          demo-customer@
        </span>
      </button>

      <!-- Role: Admin Ops (Staff) -->
      <button
        type="button"
        class="group relative flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 min-h-[44px]"
        :class="[
          selectedRole === 'admin'
            ? 'border-brand-ink bg-white shadow-whisper text-brand-ink'
            : 'border-brand-hairsoft bg-white/70 hover:bg-white hover:border-brand-hair text-brand-muted',
        ]"
        aria-label="Gunakan akun demo admin: demo-admin@shelfstack.local"
        @click="selectRole('admin')"
      >
        <div class="min-w-0 pr-1">
          <div class="flex items-center gap-1">
            <span
              class="font-semibold text-xs leading-none"
              :class="selectedRole === 'admin' ? 'text-brand-ink' : 'text-brand-ink/90'"
            >
              Admin Ops
            </span>
            <span
              v-if="selectedRole === 'admin'"
              class="inline-flex items-center text-[9px] font-bold text-brand-success"
              aria-label="Akun terpilih"
            >
              <i class="pi pi-check text-[8px]" aria-hidden="true" />
            </span>
          </div>
          <p class="text-[10px] text-brand-muted truncate m-0 mt-0.5">Pesanan, Stok &amp; CS</p>
        </div>
        <span
          class="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors"
          :class="
            selectedRole === 'admin'
              ? 'bg-brand-canvas-soft text-brand-ink'
              : 'text-brand-muted/70 group-hover:text-brand-muted'
          "
        >
          demo-admin@
        </span>
      </button>
    </div>
  </div>
</template>
