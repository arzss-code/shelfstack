<script setup lang="ts"></script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--p-content-background);
    "
  >
    <!-- Header: Sticky & Subtle Shadow -->
    <header
      style="
        padding: 1rem 2rem;
        background-color: var(--p-content-background);
        border-bottom: 1px solid var(--p-content-border-color);
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      "
    >
      <div
        style="
          width: 100%;
          max-width: 1200px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <h2
          style="
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--p-text-color);
            font-weight: 700;
            letter-spacing: -0.02em;
          "
        >
          <i
            class="pi pi-box"
            style="font-size: 1.5rem; color: var(--p-primary-color)"
          ></i>
          Simple Product CRUD
        </h2>
        <nav>
          <NuxtLink
            to="/"
            style="
              text-decoration: none;
              font-weight: 600;
              color: var(--p-text-muted-color);
              transition: color 0.2s ease;
            "
            >Beranda</NuxtLink
          >
        </nav>
      </div>
    </header>

    <!-- Main Content Container: Max Width Constraint -->
    <main
      style="flex: 1; display: flex; justify-content: center; padding: 2rem"
    >
      <div style="width: 100%; max-width: 1200px">
        <slot />
      </div>
    </main>
  </div>
</template>
