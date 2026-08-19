# FSD-Lite Architecture Guidelines

When developing or refactoring this project, you MUST strictly adhere to the Feature-Scoped Development (FSD-lite) pattern:

## Core Principles

1. **Feature Isolation**: Never dump all components into `app/components/` or all composables into `app/composables/`. If a component, composable, or utility is specific to a domain feature (e.g., `activities`, `products`), it MUST be placed inside its feature directory (`app/features/<feature-name>/`).
   - Example: `app/features/activities/components/ActivityDetailDialog.vue`
   - Example: `app/features/activities/composables/useActivities.ts`
2. **Pages are purely for Routing**: Files in `app/pages/` should contain minimal business logic. They act as orchestrators that import components and composables from the `app/features/` directories.
3. **Global Shared Logic**: Only use `app/components/`, `app/composables/`, and `app/utils/` for elements that are 100% generic and used across multiple, unrelated features (e.g., global Navbar, generic UI buttons, global date formatter).

## Compliance with Talenavi SOP

- Keep logic and views separated.
- Strictly adhere to naming conventions: `camelCase` for composables/utils, `PascalCase` for Vue components.
- Component length should not exceed ~300 lines. If it grows larger, delegate to sub-components within the feature directory.
