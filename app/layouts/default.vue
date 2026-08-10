<script setup lang="ts">
// You can import NuxtLink for routing or PrimeVue Menubar if needed
</script>

<template>
  <div>
    <header style="padding: 1rem; border-bottom: 1px solid var(--p-content-border-color); display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
        <i class="pi pi-box" style="font-size: 1.5rem"></i>
        Talenavi
      </h2>
      <nav>
        <!-- Place for navigation links -->
      </nav>
    </header>

    <main style="padding: 2rem;">
      <slot />
    </main>
  </div>
</template>
