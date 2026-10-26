# ShelfStack — Design Tokens & Component Specifications

**Design System Architecture:** Gallery Modernist (v1.0.0-PROD)  
**Brand Identity:** ShelfStack — Archival Department Store & Precision Hardware Dispatch  
**Type Scale & Grid Foundation:** Mobbin-Inspired Modernist System (Near-Black Ink on Pure Canvas)

---

## 1. Design Tokens Specification

### 1.1 Color Palette (CSS Variables & Hex Codes)

The visual architecture is strictly monochrome (`#141414` on `#ffffff`), built on a neutral tint ladder rather than elevation shadows. A single chromatic accent (`#0066ff`) is reserved exclusively for commercial signals, live telemetry states, and critical actions.

| Token Name              | CSS Custom Property               | Hex / Value | Usage & Context                                                                |
| :---------------------- | :-------------------------------- | :---------- | :----------------------------------------------------------------------------- |
| **Primary Ink**         | `--color-primary` / `--color-ink` | `#141414`   | Brand headers, primary CTA pills, footer banner, high-contrast text            |
| **Soft Ink**            | `--color-ink-soft`                | `#262626`   | Secondary lockups, subheadings, dense table labels                             |
| **Text Muted**          | `--color-text-muted`              | `#707070`   | Supporting copy, specs qualifiers, metadata timestamps, subtitles              |
| **Text Faint**          | `--color-text-faint`              | `#adadad`   | Input placeholders, de-emphasized footer links, fine print                     |
| **Canvas**              | `--color-canvas`                  | `#ffffff`   | Primary base background, card resting surface                                  |
| **Canvas Soft**         | `--color-canvas-soft`             | `#f3f3f3`   | 6% ink wash: nav pill background, featured card fill, segmented control tracks |
| **Field**               | `--color-field`                   | `#f0f0f0`   | 8% ink wash: borderless form inputs, search fields, search bars                |
| **Hairline Soft**       | `--color-hairline-soft`           | `#f0f0f0`   | 1px card borders on white-on-white surfaces (pricing, specs, reviews)          |
| **Hairline**            | `--color-hairline`                | `#e0e0e0`   | 16% neutral border for outlined pill buttons and interactive tabs              |
| **Accent Electric**     | `--color-accent`                  | `#0066ff`   | Commercial signals ("Popular", savings badges, active logistics markers)       |
| **Success / Verified**  | `--color-success`                 | `#00875a`   | Stock availability ("In Stock & Ready"), verified order authentications        |
| **Warning / Pre-order** | `--color-warning`                 | `#ffab00`   | "Low Stock", "Pre-Order Allocation" badges                                     |

---

### 1.2 Typography System

- **Primary Font Family:** `Saans`, `-apple-system, BlinkMacSystemFont, "Hanken Grotesk", "Helvetica Neue", sans-serif`
- **Typographic Voice:** Tight leading on headlines (`1.0` - `1.13`), bookish weights (`456`) for body, light airiness (`300`) for hero subtitles. Declarative sentence case with terminal periods (`.`).

| Role Token  | Font Size         | Weight | Line Height | Letter Spacing | CSS Implementation Example                                                            |
| :---------- | :---------------- | :----- | :---------- | :------------- | :------------------------------------------------------------------------------------ |
| `display`   | `80px` (5rem)     | `652`  | `1.0`       | `0`            | `font-size: 5rem; font-weight: 650; line-height: 1;`                                  |
| `heading-1` | `56px` (3.5rem)   | `652`  | `1.0`       | `0`            | `font-size: 3.5rem; font-weight: 650; line-height: 1;`                                |
| `heading-2` | `44px` (2.75rem)  | `652`  | `1.13`      | `0`            | `font-size: 2.75rem; font-weight: 650; line-height: 1.13;`                            |
| `heading-3` | `32px` (2rem)     | `652`  | `1.13`      | `0`            | `font-size: 2rem; font-weight: 650; line-height: 1.13;`                               |
| `heading-4` | `24px` (1.5rem)   | `652`  | `1.25`      | `0`            | `font-size: 1.5rem; font-weight: 650; line-height: 1.25;`                             |
| `title`     | `20px` (1.25rem)  | `600`  | `1.3`       | `0`            | `font-size: 1.25rem; font-weight: 600; line-height: 1.3;`                             |
| `body-lg`   | `20px` (1.25rem)  | `300`  | `1.38`      | `0`            | `font-size: 1.25rem; font-weight: 300; line-height: 1.38;`                            |
| `body`      | `16px` (1rem)     | `456`  | `1.38`      | `0`            | `font-size: 1rem; font-weight: 450; line-height: 1.38;`                               |
| `body-sm`   | `14px` (0.875rem) | `456`  | `1.43`      | `0`            | `font-size: 0.875rem; font-weight: 450; line-height: 1.43;`                           |
| `link`      | `16px` (1rem)     | `600`  | `1.38`      | `0`            | `font-size: 1rem; font-weight: 600; line-height: 1.38;`                               |
| `label`     | `12px` (0.75rem)  | `600`  | `1.33`      | `0`            | `font-size: 0.75rem; font-weight: 600; line-height: 1.33; text-transform: uppercase;` |
| `caption`   | `12px` (0.75rem)  | `456`  | `1.33`      | `0`            | `font-size: 0.75rem; font-weight: 450; line-height: 1.33;`                            |

---

### 1.3 Spatial System & Grid

Built on an 8px base rhythm with 4px half-steps for micro-alignments:

| Spacing Token      | Pixels  | Rem Value | Common Usage                                       |
| :----------------- | :------ | :-------- | :------------------------------------------------- |
| `space-xxs`        | `4px`   | `0.25rem` | Badge padding, icon gap, border offset             |
| `space-xs`         | `8px`   | `0.5rem`  | Internal element spacing, chip margins             |
| `space-sm`         | `12px`  | `0.75rem` | Input field vertical padding, tag lists            |
| `space-md`         | `16px`  | `1rem`    | Button horizontal padding, standard component gaps |
| `space-lg`         | `24px`  | `1.5rem`  | Card internal padding (`padding: 24px`)            |
| `space-xl`         | `32px`  | `2rem`    | Sub-grid row gaps, module separators               |
| `space-xxl`        | `48px`  | `3rem`    | Large section padding                              |
| `space-section`    | `80px`  | `5rem`    | Major vertical separation between page sections    |
| `space-section-lg` | `120px` | `7.5rem`  | Hero-to-content whitespace interludes              |

---

### 1.4 Shapes & Border Radius

| Token Name         | Value    | Geometric Classification | Usage                                                         |
| :----------------- | :------- | :----------------------- | :------------------------------------------------------------ |
| `rounded-none`     | `0px`    | Flat                     | Full-bleed strips, vector transit map frame                   |
| `rounded-sm`       | `16px`   | Soft Rounded             | Form inputs, testimonial cards, FAQ accordion rows            |
| `rounded-md`       | `24px`   | Card Container           | Content cards, product cards, modal surfaces, footer top      |
| `rounded-squircle` | `30%`    | iOS Squircle             | App icons, studio insignia tiles, brand emblems               |
| `rounded-full`     | `9999px` | Stadium Pill             | Primary/Secondary buttons, navigation bar, filter chips, tags |

---

## 2. Component Token Specifications

### 2.1 Navigation Chrome (`nav-pill`)

- **Container:** `display: flex; align-items: center; justify-content: space-between; height: 56px; background-color: var(--color-canvas-soft); border-radius: var(--rounded-full); padding: 0 24px;`
- **Logo Area:** Scaled wordmark in `var(--color-ink)` with `font-weight: 650; font-size: 1.125rem;`
- **Search Pill:** Embedded inside nav or sub-nav with `background-color: var(--color-field); border-radius: var(--rounded-full); height: 40px; padding: 0 16px;`
- **Actions:** Cart count pill badge (`background: var(--color-ink); color: #fff; border-radius: var(--rounded-full); font-size: 0.75rem;`).

### 2.2 Buttons

#### `button-primary`

- **Fill:** `var(--color-primary)` (`#141414`)
- **Text:** `#ffffff`
- **Typography:** `var(--typography-link)` (16px / 600 weight)
- **Border-radius:** `9999px` (`var(--rounded-full)`)
- **Height / Padding:** `44px` height, `padding: 0 24px`
- **Hover State:** `opacity: 0.92; transform: translateY(-1px);`

#### `button-outline`

- **Fill:** `var(--color-canvas)` (`#ffffff`)
- **Text:** `var(--color-ink)` (`#141414`)
- **Border:** `1px solid var(--color-hairline)` (`#e0e0e0`)
- **Border-radius:** `9999px`
- **Hover State:** `background-color: var(--color-canvas-soft);`

#### `button-pill-soft`

- **Fill:** `var(--color-canvas-soft)` (`#f3f3f3`)
- **Text:** `var(--color-ink)` (`#141414`)
- **Border:** None
- **Border-radius:** `9999px`
- **Padding:** `8px 16px`

---

### 2.3 Product Card System (`product-card`)

- **Geometry:** Borderless or 1px hairline soft (`var(--color-hairline-soft)`), `border-radius: var(--rounded-md)` (24px).
- **Background:** `var(--color-canvas)` (`#ffffff`) with subtle contrast against soft canvas sections.
- **Image Container:** Aspect ratio `1:1` or `4:5`, with neutral soft background (`#f8f8f8`) and `border-radius: 18px`.
- **Badges:**
  - `Curator Pick` / `Bestseller`: Translucent pill badge (`rgba(20,20,20,0.85)` or `#141414` text on `#fff`).
  - `Price Drop` / `Savings`: Electric blue background (`#0066ff`) with `#ffffff` bold text.
- **Action Trigger:** `+ Quick Bag` stadium button or dynamic stepper.

---

### 2.4 Form Fields (`text-input`)

- **Background:** `var(--color-field)` (`#f0f0f0`)
- **Border:** None at rest (`border: 0`)
- **Active / Focus:** 2px solid `var(--color-ink)` (`#141414`) outline ring, background remains `#f0f0f0` or turns `#ffffff`.
- **Border Radius:** `16px` (`var(--rounded-sm)`)
- **Padding:** `12px 16px` (`var(--space-sm) var(--space-md)`)

---

### 2.5 Segmented Controls (`segmented-control`)

- **Track:** `background-color: var(--color-canvas-soft)` (`#f3f3f3`), `border-radius: 9999px`, padding `4px`.
- **Active Segment:** `background-color: #ffffff`, `color: var(--color-ink)`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`, `border-radius: 9999px`.
- **Inactive Segment:** `color: var(--color-text-muted)`, transparent background.

---

### 2.6 Footer Band (`footer`)

- **Fill:** Inverted `var(--color-ink)` (`#141414`)
- **Top Corners:** `border-top-left-radius: 24px; border-top-right-radius: 24px;`
- **Text & Links:** `#ffffff` for primary headlines, `var(--color-text-faint)` (`#adadad`) for links and category columns.

---

## 3. Tailwind CSS Config Mapping

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#141414',
          soft: '#262626',
        },
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#f3f3f3',
        },
        field: '#f0f0f0',
        hairline: {
          DEFAULT: '#e0e0e0',
          soft: '#f0f0f0',
        },
        accent: {
          DEFAULT: '#0066ff',
          hover: '#0052cc',
        },
        muted: '#707070',
        faint: '#adadad',
      },
      fontFamily: {
        saans: ['Saans', 'Hanken Grotesk', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '16px',
        md: '24px',
        squircle: '30%',
        full: '9999px',
      },
      spacing: {
        section: '80px',
        'section-lg': '120px',
      },
    },
  },
}
```
