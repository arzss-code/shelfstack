---
name: Gallery Modernist
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#424656'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#585a5a'
  on-tertiary: '#ffffff'
  tertiary-container: '#717272'
  on-tertiary-container: '#f8f8f8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
  ink: '#141414'
  ink-soft: '#262626'
  canvas: '#ffffff'
  canvas-soft: '#f3f3f3'
  field: '#f0f0f0'
  hairline: '#e0e0e0'
  hairline-soft: '#f0f0f0'
  text-muted: '#707070'
  text-faint: '#adadad'
  accent-electric: '#0066ff'
  overlay-scrim: rgba(115, 115, 115, 0.56)
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  link:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  label-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  caption:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies a high-end utilitarian, curatorial aesthetic tailored for technical excellence and refined product showcase. Inspired by minimalist gallery spaces and contemporary Swiss modernist publications, the interface recedes completely into a pristine monochrome backdrop, allowing products, interactive code showcases, and editorial media to command primary visual attention.

### Audience & Mood

Engineered for modern full-stack web developers, design technologists, and discerning digital consumers who appreciate structural clarity, deterministic interactions, and extreme craft. The experience evokes precision, confidence, speed, and architectural permanence.

### Style Archetype: Curatorial Neo-Grotesque

- **Strict Monochrome Canvas:** Near-black ink grounded upon stark gallery whites and nuanced stone washes.
- **Electric Focal Triggers:** Deliberate single-point saturation using `#0066ff` reserved exclusively for high-intent transactional actions, selected filter states, and commercial badges.
- **Architectural Dual-Geometry:** A deliberate dialectic between soft structural containers (16px to 24px) and perfectly rounded stadium pills (`9999px`) for all interactive triggers, buttons, and badges.

## Colors

The chromatic palette adheres to a strict gallery hierarchy. Color is not used ornamentally; it serves functional navigation, state indication, and high-value conversion.

### Color Hierarchy & Roles

- **Canvas Base (`#ffffff`):** Pure white field across root viewports, dialog sheets, and standard cards.
- **Tonal Stepping (`#f3f3f3`, `#f0f0f0`, `#e0e0e0`):** `canvas-soft` (`#f3f3f3`) isolates navigation bars, table headings, and muted utility controls; `field` (`#f0f0f0`) establishes restful input surfaces; `hairline` (`#e0e0e0`) delivers structural crispness across dividers and buttons.
- **Text & Ink Hierarchy:** Headings and primary commands use `ink` (`#141414`). Secondary annotations use `text-muted` (`#707070`), while placeholders and de-emphasized metadata employ `text-faint` (`#adadad`).
- **Electric Blue Accent (`#0066ff`):** Deployed with surgical restraint. Reserved solely for inventory status indicators, savings callouts, selected filter pills, active cart count badges, and focused checkout highlights.

## Typography

The typographic hierarchy balances structural architecture with swift editorial rhythm. **Hanken Grotesk** serves headline and display roles with razor-sharp geometric terminals and compact vertical metrics, echoing Swiss international typography. **DM Sans** delivers unyielding legibility across interface body copy, data cells, lists, and dense technical metadata.

### Typographic Guidelines

- **Leading & Kerning:** Headlines feature ultra-tight line heights (`1.0` to `1.13`) and negative letter spacing (`-0.01em` to `-0.03em`) to mimic physical architectural titling.
- **Punctuation Styling:** Major section titles adopt deliberate full-stop terminal punctuation (e.g., "Curated Volumes.") to emphasize structural finality.
- **Labels & Badges:** `label-md` utilizes an uppercase transformation paired with `+0.04em` tracking to maintain immediate optical balance when encased in pill geometry.

## Layout & Spacing

The layout is built upon an 8px base rhythm (with a 4px precision sub-unit), translating into a fluid 12-column architectural grid on desktop, a 6-column layout on tablet, and a 2-column or single-column structure on mobile devices.

### Viewport Breakpoints

- **Desktop Extra Wide (2xl):** 1536px (maximum container width 1440px centered).
- **Desktop (xl / lg):** 1280px / 1024px with 12-column grid and `gutter: 1.5rem` (24px).
- **Tablet (md):** 768px – 840px with 6-column grid and `gutter: 1rem` (16px).
- **Mobile (sm / xs):** 360px – 640px with 2-column/1-column flows and `margin: 1.25rem` (20px).

### Layout Rhythms

- **Canvas Edge Margins:** Generous 48px margins on desktop enforce the art gallery atmosphere.
- **Section Breaks:** Standard vertical spacing between major acts spans `80px` (`5rem`) to `120px` (`7.5rem`), creating dramatic negative space contrast.
- **Content Densities:** Internal component containers strictly scale from `12px` (inputs) to `24px` (cards, drawers, modals).

## Elevation & Depth

Visual depth is deliberately flat, architectural, and shadow-free. Depth is articulated through surface layering, subtle chromatic differentiation, and hairline borders rather than traditional diffused drop shadows.

### Elevation Levels

- **Level 0 (Base Canvas):** Pure flat `#ffffff` canvas. Elements sit directly on the ground plane.
- **Level 1 (Subtle Recess & Soft Tones):** `#f3f3f3` fill with no border. Used for floating utility navigation pills, comparison headers, and filter bars.
- **Level 2 (Outlined Planes):** `#ffffff` background bounded by a crisp 1px hairline border (`#f0f0f0` or `#e0e0e0`). Used for standard product cards, review units, and catalog cards.
- **Level 3 (Modal & Floating Elements):** Cart drawers, action sheets, and modal cards utilize Level 0 surface backgrounds anchored with a 1px border (`#e0e0e0`) and an ambient scrim (`rgba(115, 115, 115, 0.56)`), relying on distinct edge definition rather than heavy drop shadows.
- **Level Inverse:** Deep `#141414` fill with `#ffffff` text used for authoritative anchors such as full-bleed footers and primary conversion triggers.

## Shapes

The design system implements a roundedness scale of `3`, driving a distinctive pairing between soft card frames and ultra-smooth stadium pills.

### Geometry Rules

- **Interactive Stadium Pills (`9999px`):** Every interactive button, filter chip, floating navigation dock, segmented control, and badge is rendered as a stadium pill.
- **Structural Card Surfaces (`16px` to `24px`):** Product cards, checkout modules, review blocks, and modals use large, smooth corners (`rounded-lg` / `rounded-xl`), creating an inviting frame around sharp media assets.
- **Squircles (`30%`):** Dedicated tool icons, developer badges, and category thumbnails employ Apple-inspired 30% squircles to bridge the pill and card radiuses seamlessly.

## Components

### 1. Buttons

- **Primary Button:** Stadium pill shape (`rounded-full`), background `#141414`, foreground `#ffffff`, padding `12px 24px`. On hover, opacity steps to `0.88`. Active state scales subtly to `0.98`.
- **Accent Button (Commercial CTA):** Stadium pill, background `#0066ff`, foreground `#ffffff`, padding `12px 24px`. Deployed for checkout triggers, buy-now flows, and critical upgrades.
- **Outline Button:** Stadium pill, background transparent, border `1px solid #e0e0e0`, foreground `#141414`, hover background `#f3f3f3`.
- **Soft Utility Pill:** Background `#f3f3f3`, text `#141414`, zero border, padding `8px 16px`.

### 2. Badges & Filter Pills

- **Filter Chips:** Stadium pills with a `1px solid #e0e0e0` border, `10px 18px` padding, font `DM Sans` 14px. Selected state switches to fill `#141414` with `#ffffff` text or `#0066ff` fill for active discount/promo filters.
- **Stock Status Badge:** Pill shape, `4px 10px` padding, font size 11px uppercase bold. "In Stock" uses `#f3f3f3` fill with a `6px` `#0066ff` dot indicator. "Low Stock" uses `#141414` text with subtle border.

### 3. Product Card Grid

- **Surface:** `#ffffff` fill, `1px solid #f0f0f0` border, `20px` to `24px` border radius.
- **Visual Container:** Top image region framed in neutral wash `#f3f3f3` with seamless edge-to-edge rounding.
- **Content Section:** Internal padding `20px`. Displays title (`Hanken Grotesk` 18px Bold), subtitle/category (`text-muted` 14px), dynamic price tag (`#141414` 16px SemiBold), and quick-add icon trigger inside a 36px circular button.

### 4. Cart Drawer

- **Structure:** Right-anchored sheet spanning 420px on desktop (100vw on mobile). Background `#ffffff`, left border `1px solid #e0e0e0`.
- **Header:** Sticky top with item count pill, title "Your Bag", and an outlined circular dismiss button.
- **Line Items:** Separated by `1px solid #e0e0e0` dividers. Each item features an 80px rounded square preview, quantity stepper pill (`-`, count, `+` enclosed in `#f3f3f3`), and price.
- **Checkout Footer:** Subtotal summary, promo input pill, and a full-width `#0066ff` checkout button.

### 5. Checkout Stepper

- **Layout:** Horizontal indicator with steps: Cart → Shipping → Payment → Review.
- **Nodes:** Active step displays a filled `#0066ff` pill with white numeral; completed steps use `#141414` with a checkmark; future steps feature `#f0f0f0` with `text-faint`. Connecting rules use `1px solid #e0e0e0`.

### 6. Customer Reviews

- **Card Format:** Background `#ffffff`, border `1px solid #f0f0f0`, radius `16px`, padding `20px`.
- **Review Header:** Verified buyer badge in `#0066ff` (or electric blue check), author name in `Hanken Grotesk` 16px, and 5-star rating using pure `#141414` filled star glyphs.

### 7. Form Fields & Inputs

- **Text Inputs:** Height 48px, background `#f0f0f0`, border `1px solid transparent`, radius `16px`, padding `0 16px`, text `#141414`, placeholder `#adadad`.
- **Focused State:** Background `#ffffff`, border `2px solid #141414`, with zero drop shadow.

### 8. Checkboxes & Radio Buttons

- **Checkboxes:** 20px squares with `6px` corner rounding. Rest state has a `1.5px solid #e0e0e0` border. Checked state fills `#141414` with a white checkmark icon.
- **Radio Buttons:** 20px outer circle, `1.5px solid #e0e0e0` border. Selected state displays an inner filled circle in `#0066ff`.
