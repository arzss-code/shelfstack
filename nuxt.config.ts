// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from "@primeuix/themes/aura";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: {
    enabled: true,
  },

  css: ["primeicons/primeicons.css", "~/assets/css/main.css"],

  modules: [
    "@primevue/nuxt-module",
    "@pinia/nuxt",
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "@nuxt/eslint",
  ],

  supabase: {
    redirect: false,
  },

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: "system",
        },
      },
    },
    components: {
      include: "*",
    },
  },
});
