# Design System: ShelfStack E-Commerce Platform

## 1. Visual Theme & Atmosphere

ShelfStack is an archival modern e-commerce storefront that blends the pristine editorial clarity of gallery-white interfaces (Mobbin, Apple Store) with the fast, human-centric accessibility of top-tier consumer platforms (Zalora, Tokopedia). The visual language is intentionally restrained and content-first: near-black ink on pure canvas white, a ladder of barely-there neutral tints instead of muddy elevation shadows, stadium-pill interactive controls, and generous 24px card geometry.

The product imagery is the primary visual hero; every other element on screen steps back into quiet geometric precision. A single electric blue accent is reserved strictly for commercial signals, live indicators, and shopping triggers.

- **Density:** 4 (Daily App Balanced — generous breathing room for product photography, tight clarity in checkout and specs)
- **Variance:** 6 (Curated Asymmetry — split-screen hero showcases, horizontal scroll ribbons, non-uniform editorial value strips)
- **Motion:** 5 (Fluid & Tactile — 200ms spring-physics micro-interactions, subtle image zooms, tactile press states)

---

## 2. Color Palette & Roles

The palette is strictly calibrated around high-contrast monochrome surfaces with subtle tint stepping, energized by a singular commercial chromatic accent:

| Token Name          | Hex Code  | Role & Functional Context                                                                          |
| :------------------ | :-------- | :------------------------------------------------------------------------------------------------- |
| **Canvas White**    | `#ffffff` | Primary base background, resting card surfaces, dialog viewports                                   |
| **Canvas Soft**     | `#f3f3f3` | Subtle 6% tint wash: nav pill background, segmented control tracks, featured banner fills          |
| **Field**           | `#f0f0f0` | 8% neutral tint: search bars, pill input fields, neutral badges                                    |
| **Hairline Soft**   | `#f0f0f0` | 1px clean separation lines on cards and content modules                                            |
| **Hairline**        | `#e0e0e0` | 16% neutral border for outlined buttons, segmented chips, and input focus rings                    |
| **Primary Ink**     | `#141414` | High-contrast brand headers, primary pill buttons, footer plinth, primary typography               |
| **Soft Ink**        | `#262626` | Secondary lockups, card titles, table labels, active navigation text                               |
| **Text Muted**      | `#707070` | Supporting copy, category metadata, subtitle leads, breadcrumb inactive links                      |
| **Text Faint**      | `#adadad` | Input placeholders, de-emphasized copyright fine print, empty state copy                           |
| **Electric Blue**   | `#0066ff` | **Singular Commercial Accent:** "Tambah ke Bag" CTAs, promo chips, logo shelf tier, active markers |
| **Success Emerald** | `#00875a` | Stock availability ("Tersedia & Siap Kirim"), order verification badges                            |
| **Warning Amber**   | `#ffab00` | Stock scarcity alerts ("Sisa 2 Unit"), pre-order notifications                                     |
| **Critical Rose**   | `#e41e3f` | Form validation errors, stock depletion alerts ("Habis")                                           |

---

## 3. Typography Rules

ShelfStack uses **DM Sans** as its unified typography engine across all surfaces. Monospace fonts are strictly prohibited on consumer-facing e-commerce elements (no terminal/developer aesthetics on pricing or SKU).

- **Display & Headlines:** `DM Sans` (600–700 weight) with tight leading (`1.05` to `1.2`), optical negative tracking (`-0.02em` to `-0.03em`), and declarative sentence case.
- **Body & Captions:** `DM Sans` (400–500 weight) with relaxed leading (`1.4` to `1.5`) and standard tracking for effortless legibility.
- **Commerce Prices:** `DM Sans` (600–700 weight) rendered in clean proportional figures with compact currency prefix (`Rp1.499.000`), never monospaced.
- **Font Stack:** `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Banned Typography:** JetBrains Mono, Fira Code, Courier, generic serif fonts (Times New Roman, Georgia), or uncalibrated weights.

### Type Hierarchy Scale

| Token             | Size        | Weight | Line Height | Tracking  | Application                               |
| :---------------- | :---------- | :----- | :---------- | :-------- | :---------------------------------------- |
| `display-hero`    | `48px–64px` | 700    | `1.1`       | `-0.03em` | Homepage Hero headline                    |
| `heading-section` | `28px–36px` | 700    | `1.2`       | `-0.02em` | Section headers, catalog titles           |
| `heading-card`    | `18px–20px` | 600    | `1.25`      | `-0.01em` | Product card titles, PDP product name     |
| `price-lg`        | `28px–32px` | 700    | `1.15`      | `-0.02em` | Product detail page main price            |
| `price-card`      | `16px–18px` | 700    | `1.2`       | `-0.01em` | Catalog & product list prices             |
| `body-base`       | `15px–16px` | 400    | `1.5`       | `0`       | Product descriptions, editorial body text |
| `body-sm`         | `13px–14px` | 400    | `1.4`       | `0`       | Secondary metadata, spec descriptions     |
| `badge-caption`   | `11px–12px` | 600    | `1.3`       | `0.02em`  | Pill chips, status tags, stock badges     |

---

## 4. Component Stylings

### App Logo (`AppLogo.vue` / `logo.svg`)

- **Emblem Mark:** 24×24px geometric rounded container (`rx=7`, fill `#141414`) housing three horizontal shelf bars:
  - Top tier: 14×3px (`rx=1.5`, fill `#ffffff`)
  - Middle tier: 14×3px (`rx=1.5`, fill `#ffffff`)
  - Bottom tier (Accent): 9×3px (`rx=1.5`, fill `#0066ff`)
- **Wordmark:** `ShelfStack` in `DM Sans` Bold with tight tracking (`-0.5px`).
- **Variants:** `default` (dark text for canvas white), `inverse` (white text & container for dark footer plinth), and `mark-only`.

### Navigation Pill (`AppNavbar.vue`)

- **Geometry:** Stadium pill (`rounded-full`, height 56px, `max-w-5xl`) centered with safe margin padding.
- **Surface:** Frosted glassmorphism (`bg-brand-canvas-soft/90 backdrop-blur-xl border border-brand-hair`).
- **Elements:** `AppLogo` mark on left, clean navigation links in center, embedded quick-search pill and authenticated user avatar on right.

### Buttons & Action Controls

- **Primary Commerce CTA:** Stadium pill (`rounded-full`), background `#0066ff` (Electric Blue) or `#141414` (Primary Ink), text `#ffffff`, font-semibold. Tactile active translation: `active:scale-[0.98]`.
- **Secondary / Outline Button:** Stadium pill, transparent background, 1px `#e0e0e0` border, `#141414` text, hover: `#f3f3f3`.
- **Category Filter Chips:** Pill shape (`rounded-full`), active state: `#141414` with `#ffffff` text; resting state: `#ffffff` with `#707070` text and 1px border.

### Product Card (`ProductList.vue`)

- **Container:** `rounded-24px` (`rounded-card`) with flat 1px `#f0f0f0` hairline border and ambient whisper shadow.
- **Media Stage:** `aspect-square` with `rounded-16px` (`rounded-media`) container, subtle 200ms image zoom on hover (`group-hover:scale-105`).
- **Badge Positioning:** Top-left floating pill badge (`rounded-full`, padding 4px 10px, font-semibold 11px) indicating category or stock status.
- **Price Block:** Bold `DM Sans` (`font-bold text-brand-ink`), clean non-monospaced currency formatting (`Rp1.499.000`).

### Footer Plinth (`AppFooter.vue`)

- **Surface:** Inverted Modernist Plinth (`bg-brand-ink text-white`) with generous top-corner radius (`rounded-t-card`).
- **Telemetry:** Live green pulsing beacon indicating active system status, verified Nuxt 4 + Supabase architecture.
- **Structure:** 3-tier layout: Brand mission with `AppLogo variant="inverse"`, multi-column department navigation, and newsletter subscription pill.

---

## 5. Layout Principles

1. **White Canvas Primacy:** Content and photography sit on pure, uncluttered `#ffffff`. No artificial gray background slabs across the entire viewport.
2. **Asymmetric Grid Balance:** Hero sections feature split-screen compositions (asymmetric text left, curated product showcase right).
3. **Pill Ribbon Scroll Snap:** Category navigation utilizes native horizontal scrolling with snap points on mobile/tablet.
4. **Clean Column Collapse:** 4-column product grids on desktop (`lg:grid-cols-4`) scale gracefully to 3-column on tablet (`md:grid-cols-3`) and 2-column on mobile (`grid-cols-2`), never single-column stretching.
5. **Generous Breathing Space:** Major sections breathe with 80px to 120px vertical padding (`py-20` to `py-28`), preserving an airy, premium catalog experience.

---

## 6. Motion & Micro-Interactions

- **Timing Function:** Spring-like ease-out cubic bezier (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Tactile Feedback:** Every button and interactive card responds with subtle active scaling (`scale-[0.98]`) and immediate 150ms hover state changes.
- **Skeletal Loaders:** Skeleton placeholders mirror the exact geometry of product cards and badges during asynchronous queries — no generic circular spinning wheels.
- **Hardware Acceleration:** Animations strictly utilize `transform` and `opacity` properties for buttery 60fps/120fps rendering on all devices.

---

## 7. Anti-Patterns (Strictly Prohibited)

1. **NO Monospace on Commerce:** Never use `font-mono`, `JetBrains Mono`, `Fira Code`, or monospaced numbers for prices, SKUs, or product metadata.
2. **NO Developer / Terminal Clutter:** Banned badges like "ARCHIVAL VAULT", "GEN 4 ARTIFACT", or raw JSON aesthetics on consumer storefronts.
3. **NO AI Slop Visuals:** No glowing neon borders, purple-to-blue gradient headers, floating decorative blur orbs, or generic 3-card copy-paste rows.
4. **NO Hardcoded Hex Codes:** All styling must resolve through semantic Tailwind tokens (`brand-*`) mapped to CSS variables in `main.css`.
5. **NO Centered Low-Density Heroes:** Never build a generic centered hero with small centered text and empty margins; use confident split compositions with authentic photography.
6. **NO Generic Names or Clichés:** Avoid generic stock phrases ("Next-Gen", "Seamless Experience", "Elevate Your Lifestyle"). Use clear, human commerce copy.
