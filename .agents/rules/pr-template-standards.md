# STRICT RULE: PULL REQUEST & BRANCH NAMING STANDARDS

Every Pull Request and branch created in this repository MUST follow industry-standard engineering conventions (Gitmore PR Template structure) and remain clean for public/portfolio evaluation.

---

## 1. Branch Naming Convention

- Always use descriptive, domain-scoped branch names matching the actual technical scope:
  - `feat/<domain-slug>` (e.g., `feat/seed-ecosystem-and-health-telemetry`)
  - `fix/<domain-slug>` (e.g., `fix/order-detail-layout-grid`)
  - `hotfix/<domain-slug>`
  - `refactor/<domain-slug>`
  - `chore/<domain-slug>`
  - `docs/<domain-slug>`
- **NEVER** use misleading labels like `production` or `prod` on feature/development branches.

---

## 2. Pull Request Description Template

When creating or updating a Pull Request (`gh pr create` or `gh pr edit`), ALWAYS follow the structure in `.github/PULL_REQUEST_TEMPLATE.md` or the specialized templates in `.github/PULL_REQUEST_TEMPLATE/`:

- **General / Multi-Scope PRs**: `.github/PULL_REQUEST_TEMPLATE.md`
  - `## Description` (concise summary of _what_ and _why_, plus a Mermaid diagram or module tree for architectural changes)
  - `## Type of Change` (checkboxes)
  - `## Changes Made` & `### Key Files Changed` (`File | Change` table)
  - `## API & Database Changes`
  - `## How to Test` (numbered step-by-step verification guide + `### Verification Output` with real executed results)
  - `## Checklist`
  - `## Related Issues / PRs`
- **Specialized PRs**:
  - Feature: `.github/PULL_REQUEST_TEMPLATE/feature.md`
  - Bug Fix: `.github/PULL_REQUEST_TEMPLATE/bugfix.md`
  - Hotfix: `.github/PULL_REQUEST_TEMPLATE/hotfix.md`
  - Refactor: `.github/PULL_REQUEST_TEMPLATE/refactor.md`
  - Docs: `.github/PULL_REQUEST_TEMPLATE/docs.md`

---

## 3. Public Repository Hygiene (Prohibitions)

- **NO Internal Company Jargon in PRs/Templates**: Never mention internal SOP names (e.g., "Talenavi SOP") in `.github/` templates, Pull Request descriptions, or GitHub Issues. Use universal software engineering terminology.
- **NO Unverified Test Claims**: Only list commands (`pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`, `pnpm build`) in `Verification Output` that were actually executed and passed.
- **Use HTML Comment Placeholders (`<!-- ... -->`)**: In Markdown templates, use `<!-- ... -->` for instructions instead of bracketed `[placeholder text]` so unfilled hints remain invisible when rendered.
