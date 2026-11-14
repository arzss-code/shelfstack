# STRICT RULE: PULL REQUEST & BRANCH NAMING STANDARDS

Every Pull Request and branch created in this repository MUST follow industry-standard engineering conventions (Gitmore PR Template structure) and remain clean for public/portfolio evaluation.

---

## 1. Branch Naming & Versioning Convention

- **Allowed Branch Prefixes**:
  - `feat/<domain-slug>`: New user-facing or technical features
  - `fix/<domain-slug>`: Bug fixes and visual adjustments
  - `hotfix/<domain-slug>`: Urgent critical production patches
  - `refactor/<domain-slug>`: Code restructuring without behavior changes
  - `chore/<domain-slug>`: Tooling, dependency, and configuration updates
  - `docs/<domain-slug>`: Documentation, guides, and architectural notes
- **Branch Name Length & Clarity Guidelines**:
  - Keep domain slugs concise and focused: ideal length is **2 to 4 words** (around 15 to 35 characters).
  - Avoid long sentence-like names (e.g., prefer `fix/email-preview-backdrop` over `fix/email-preview-modal-full-backdrop-and-scroll-lock`).
  - Use lowercase alphanumeric characters and hyphens only (kebab-case).
  - **NEVER** use misleading labels like `production` or `prod` on feature or development branches.
  - Branch lifecycle is ephemeral: always delete the branch upon successful merge into `develop` or `main`.
- **Environment & SemVer Alignment**:
  - `develop` branch: Represents active integration and staging testing. Uses pre-release SemVer labels (`X.Y.Z-beta.N` during active sprint testing, `X.Y.Z-rc.N` during pre-release freeze).
  - `main` branch: Represents stable production. Receives release merges from `develop` accompanied by official stable Git tags (`vX.Y.Z`).

---

## 2. Mandatory Pull Request Template Usage

When creating or updating a Pull Request (`gh pr create` or `gh pr edit`), you MUST ALWAYS use the official Markdown templates provided in `.github/PULL_REQUEST_TEMPLATE/` or `.github/PULL_REQUEST_TEMPLATE.md`. Writing ad-hoc, informal, or abbreviated descriptions (such as plain `## Summary` bullets) is **STRICTLY FORBIDDEN**.

### Template Selection Guide:

- **Feature & Enhancements**: `.github/PULL_REQUEST_TEMPLATE/feature.md`
- **Bug Fixes**: `.github/PULL_REQUEST_TEMPLATE/bugfix.md`
- **Hotfixes**: `.github/PULL_REQUEST_TEMPLATE/hotfix.md`
- **Refactoring**: `.github/PULL_REQUEST_TEMPLATE/refactor.md`
- **Documentation**: `.github/PULL_REQUEST_TEMPLATE/docs.md`
- **General / Multi-Scope PRs**: `.github/PULL_REQUEST_TEMPLATE.md`

### Required Execution Protocol:

1. Always base the PR description directly on the selected template file.
2. Fill every section completely:
   - Clear description and architectural context.
   - User Story (`As a... I want... so that...`).
   - Detailed technical implementation choices.
   - `### Key Files Changed` table with accurate paths and summaries.
   - API / Database impact sections.
   - Numbered step-by-step `How to Test` instructions.
   - `### Verification Output` with real, executed terminal commands (`pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`, `order-service` tests).
   - Marked checkboxes (`[x]`) in the Checklist and other selection lists.
3. When using `gh pr create` or `gh pr edit`, supply the fully populated template via `--body-file` or `--body`. Never bypass template fields.

---

## 3. Public Repository Hygiene (Prohibitions)

- **NO Internal Company Jargon in PRs/Templates**: Never mention internal SOP names (e.g., "Talenavi SOP") in `.github/` templates, Pull Request descriptions, or GitHub Issues. Use universal software engineering terminology.
- **NO Unverified Test Claims**: Only list commands (`pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`, `pnpm build`) in `Verification Output` that were actually executed and passed.
- **Use HTML Comment Placeholders (`<!-- ... -->`)**: In Markdown templates, use `<!-- ... -->` for instructions instead of bracketed `[placeholder text]` so unfilled hints remain invisible when rendered.
