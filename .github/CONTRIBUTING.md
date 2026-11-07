# Contributing to ShelfStack

Thank you for contributing to **ShelfStack**. This guide outlines the repository workflow, branch naming conventions, quality gates, and how to use our Pull Request and Issue templates.

---

## 1. Package Manager & Core Commands

This repository strictly uses **pnpm**:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run linter
pnpm lint

# Run full TypeScript check (app + server)
pnpm typecheck

# Run unit test suite
pnpm exec vitest run

# Run production build check
pnpm build

# Seed database (Remote Supabase Cloud or Local Docker)
pnpm db:seed
pnpm db:seed:local
```

---

## 2. Branching & Commit Conventions

- **Base Branches:**
  - `main`: Production-ready releases
  - `develop`: Active integration branch
- **Topic Branches:**
  - `feat/<descriptive-slug>`: New features
  - `fix/<descriptive-slug>`: Bug fixes
  - `hotfix/<descriptive-slug>`: Urgent critical fixes
  - `refactor/<descriptive-slug>`: Code restructuring without behavior changes
  - `chore/<descriptive-slug>`: Tooling, CI/CD, or configuration updates
  - `docs/<descriptive-slug>`: Documentation updates

---

## 3. Pull Request Templates

By default, opening a new Pull Request automatically loads [`.github/PULL_REQUEST_TEMPLATE.md`](./PULL_REQUEST_TEMPLATE.md).

We also provide specialized templates inside [`.github/PULL_REQUEST_TEMPLATE/`](./PULL_REQUEST_TEMPLATE/) for specific types of changes:

| Template               | File                                        | Best Used For                                                              |
| :--------------------- | :------------------------------------------ | :------------------------------------------------------------------------- |
| **Standard (Default)** | `.github/PULL_REQUEST_TEMPLATE.md`          | General changes or multi-scope updates                                     |
| **Feature**            | `.github/PULL_REQUEST_TEMPLATE/feature.md`  | New user-facing features, API endpoints, and database migrations           |
| **Bug Fix**            | `.github/PULL_REQUEST_TEMPLATE/bugfix.md`   | Root-cause analysis, reproduction steps, and regression verification       |
| **Hotfix**             | `.github/PULL_REQUEST_TEMPLATE/hotfix.md`   | Urgent fixes requiring severity classification and rollback plans          |
| **Refactor**           | `.github/PULL_REQUEST_TEMPLATE/refactor.md` | Component modularization, architectural cleanup, and contract preservation |
| **Documentation**      | `.github/PULL_REQUEST_TEMPLATE/docs.md`     | ADRs, README updates, and technical guides                                 |

### Selecting a Specific Template

**Via GitHub Web URL (`?template=` query parameter):**
Append `?template=<filename>.md` when opening a PR in the browser:

- Feature PR: `.../compare/develop...feat/my-branch?template=feature.md`
- Bug Fix PR: `.../compare/develop...fix/my-branch?template=bugfix.md`
- Hotfix PR: `.../compare/develop...hotfix/my-branch?template=hotfix.md`
- Refactor PR: `.../compare/develop...refactor/my-branch?template=refactor.md`
- Docs PR: `.../compare/develop...docs/my-branch?template=docs.md`

**Via GitHub CLI (`gh pr create`):**

```bash
gh pr create --base develop --template ".github/PULL_REQUEST_TEMPLATE/feature.md"
```
