# ShelfStack — Integrasi Design Tokens ke Tailwind CSS v4

Panduan arsitektur implementasi token desain W3C ShelfStack ke dalam **Tailwind CSS v4** (CSS-first configuration menggunakan direktif `@theme`).

---

## 1. Konsep Utama Tailwind CSS v4

Tailwind CSS v4 beralih penuh ke **CSS-first configuration** menggunakan direktif `@theme` di stylesheet utama (`globals.css` / `main.css`) tanpa perlu file `tailwind.config.js`.

Token dari DTCG `tokens.json` dipetakan langsung menjadi variabel CSS native dan utility class otomatis.

---

## 2. Konfigurasi Stylesheet Utama (`app/globals.css`)

```css
@import 'tailwindcss';

@theme {
  /* Color Palette — Monochrome Ladder & Electric Blue */
  --color-primary: #141414;
  --color-ink: #141414;
  --color-ink-soft: #262626;

  --color-text-muted: #707070;
  --color-text-faint: #adadad;
  --color-text-on-primary: #ffffff;

  --color-canvas: #ffffff;
  --color-canvas-soft: #f3f3f3;
  --color-field: #f0f0f0;

  --color-hairline: #e0e0e0;
  --color-hairline-soft: #f0f0f0;

  --color-accent: #0066ff;
  --color-accent-hover: #0052cc;

  --color-status-success: #00875a;
  --color-status-warning: #ffab00;

  /* Typography Stack */
  --font-primary: 'Saans', 'Hanken Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Variable Weights Khas Gallery Modernist */
  --font-weight-light: 300;
  --font-weight-regular: 456;
  --font-weight-semibold: 600;
  --font-weight-display: 652;

  /* Spacing Grid (8px Base & 4px Half-Steps) */
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-section: 80px;
  --spacing-section-lg: 120px;

  /* Border Radius */
  --radius-none: 0px;
  --radius-sm: 16px;
  --radius-md: 24px;
  --radius-squircle: 30%;
  --radius-full: 9999px;

  /* Border Width */
  --border-hairline: 1px;
  --border-focus-ring: 2px;
}

/* Base Body Styles */
@layer base {
  body {
    background-color: var(--color-canvas);
    color: var(--color-ink);
    font-family: var(--font-primary);
    font-weight: var(--font-weight-regular);
    letter-spacing: 0;
    -webkit-font-smoothing: antialiased;
  }
}
```

---

## 3. Contoh Implementasi Komponen UI

### A. Floating Navigation Pill (`nav-pill`)

```html
<header
  class="sticky top-6 z-50 flex h-14 w-full max-w-5xl items-center justify-between mx-auto px-6 bg-canvas-soft rounded-full"
>
  <div class="flex items-center gap-3">
    <span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
    <span class="font-display font-[652] text-lg tracking-tight text-ink"> SHELFSTACK </span>
  </div>

  <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-text-muted">
    <a href="#showroom" class="hover:text-ink transition-colors">Showroom</a>
    <a href="#hardware" class="hover:text-ink transition-colors">Hardware</a>
    <a href="#curations" class="text-ink">Curations</a>
    <a href="#support" class="hover:text-ink transition-colors">Customer Care</a>
  </nav>

  <div class="flex items-center gap-3">
    <button
      class="flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
    >
      <span>Bag</span>
      <span
        class="inline-flex items-center justify-center h-5 px-2 text-xs font-bold rounded-full bg-accent text-white"
      >
        3
      </span>
    </button>
  </div>
</header>
```

---

### B. Modernist Product Card (`product-card`)

```html
<div
  class="group relative flex flex-col justify-between p-6 bg-canvas border border-hairline-soft rounded-md transition-all hover:border-hairline"
>
  <div>
    <!-- Media Container 1:1 -->
    <div
      class="relative aspect-square w-full overflow-hidden rounded-[18px] bg-canvas-soft mb-5 flex items-center justify-center"
    >
      <img
        src="/images/product-sample.jpg"
        alt="Studio ANC Headphone"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute top-3 left-3 flex flex-col gap-1.5">
        <span
          class="px-3 py-1 text-xs font-semibold rounded-full bg-ink/85 text-text-on-primary backdrop-blur-sm"
        >
          Curator Pick
        </span>
        <span class="px-3 py-1 text-xs font-bold rounded-full bg-accent text-white">
          -$30 OFF
        </span>
      </div>
    </div>

    <!-- Metadata -->
    <p class="text-xs uppercase font-semibold text-text-muted mb-1 tracking-wider">
      Audio Specification
    </p>
    <h3 class="text-xl font-[652] leading-tight text-ink mb-2">Studio ANC Wireless Over-Ear</h3>
  </div>

  <!-- Price & CTA -->
  <div class="mt-4 pt-4 border-t border-hairline-soft flex items-center justify-between">
    <div>
      <span class="text-xs text-text-faint block">Vault Price</span>
      <span class="text-lg font-bold text-ink">$229.00</span>
    </div>
    <button
      class="h-10 px-4 rounded-full bg-canvas-soft text-ink text-sm font-semibold hover:bg-ink hover:text-white transition-colors"
    >
      + Quick Bag
    </button>
  </div>
</div>
```

---

### C. Borderless Search Input Field (`text-input`)

```html
<div class="relative w-full max-w-md">
  <input
    type="text"
    placeholder="Search curated items, serial keys, designers..."
    class="w-full h-11 px-4 text-sm bg-field text-ink placeholder:text-text-faint rounded-sm outline-none focus:ring-2 focus:ring-ink transition-shadow"
  />
  <kbd
    class="absolute right-3 top-2.5 px-2 py-0.5 text-xs text-text-muted bg-canvas rounded border border-hairline"
  >
    Ctrl K
  </kbd>
</div>
```

---

### D. Segmented Billing Control (`segmented-control`)

```html
<div class="inline-flex p-1 bg-canvas-soft rounded-full">
  <button class="px-5 py-2 text-sm font-semibold rounded-full bg-canvas text-ink shadow-sm">
    Monthly Billing
  </button>
  <button
    class="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full text-text-muted hover:text-ink"
  >
    <span>Annual Commitment</span>
    <span class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-accent text-white">
      Save 25%
    </span>
  </button>
</div>
```

---

## 4. Keunggulan Arsitektur Tailwind CSS v4

1. **Zero JS Config Overhead**: Tidak memerlukan build-step Babel/CJS untuk file `tailwind.config.js`.
2. **Native CSS Variables**: Otomatis mengekspos variabel CSS native seperti `var(--color-canvas-soft)` dan class `bg-canvas-soft`.
3. **Sub-pixel Variable Fonts**: Mendukung weight non-standar `font-[652]` dan `font-[456]` secara native.
4. **Sinkronisasi Otomatis**: Mudah diintegrasikan dengan Style Dictionary dari file `tokens.json`.
