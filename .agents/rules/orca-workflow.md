---
trigger: always_on
---

# Orca Worktree, Terminal, and Multi-Agent Orchestration Rules

When operating inside Orca or using the `orca` CLI in this repository, you MUST follow both the Talenavi Global Governance rules and the ShelfStack project conventions below.

## 1. Repository Configuration (`orca.yaml` & `.worktreeinclude`)

- **`orca.yaml` (Tracked at Repo Root)**:
  - `setupAgentStartupPolicy: wait-for-setup` ensures `pnpm install --frozen-lockfile` (and `nuxt prepare`) finishes before an agent begins work in a new worktree.
  - `scripts.setup` runs `pnpm install --frozen-lockfile`. Never replace this with `npm`, `npx`, `yarn`, or `bun`.
  - `defaultTabs` defines the standard `Dev Server` (`pnpm dev`) tab.
  - `issueCommand` embeds the mandatory 4-Gate Talenavi workflow and ShelfStack quality gates.
- **`.worktreeinclude` (Tracked at Repo Root)**:
  - Copies `.env` and `.mcp.json` from the primary worktree into newly created Orca child worktrees so `server/plugins/00.env-guard.ts` does not block Nuxt or Playwright startup.
  - Never add secrets directly into `orca.yaml` or `.worktreeinclude`; only reference gitignored filenames in `.worktreeinclude`.
- **`.orca/` Directory (Gitignored)**:
  - Local overrides (such as `.orca/issue-command`) live in `.orca/` and are ignored by Git.

## 2. Worktree & Branch Standards in Orca

- Prefer `orca worktree create` over raw `git worktree add` so Orca tracks the workspace, copies `.worktreeinclude` files, and runs `orca.yaml` setup hooks:
  ```bash
  orca worktree create --repo id:4b9dea79-206c-4d7c-b37a-3a6519d14cf2 --branch feat/<domain-slug> --base origin/main --json
  ```
- **Branch Naming**: Always use concise, domain-scoped branch prefixes (`feat/<domain-slug>`, `fix/<domain-slug>`, `hotfix/<domain-slug>`, `refactor/<domain-slug>`, `chore/<domain-slug>`, `docs/<domain-slug>`), ideally 2 to 4 words. Never use `production` in feature branch names, and never push directly to `main`.
- **Base Ref**: Keep the repository base ref pointed at `origin/main`.

## 3. Package Manager & Quality Gates in Orca Terminals

- **Strict `pnpm` Only**: Every command executed via `orca terminal send`, `orca terminal spawn`, `orca.yaml` hooks, or worker dispatches MUST use `pnpm` (`pnpm install --frozen-lockfile`, `pnpm exec <bin>`, `pnpm dlx <pkg>`, `pnpm --filter <workspace> <script>`).
- **Mandatory Quality Gate Before Completion**:
  1. `pnpm lint` (must exit 0 with 0 errors)
  2. `pnpm typecheck` (must exit 0)
  3. `pnpm exec vitest run` (never run `pnpm test` in one-shot scripts because it starts watch mode)
- **Commit & Hook Discipline**:
  - Format: `<type>: [AA] <short description in English>`
  - Never pass `--no-verify` or `-n` to `git commit`.

## 4. Multi-Agent Orchestration & Handoffs

- **Supervised Parallel Work (`orca orchestration`)**:
  - When dispatching parallel Orca workers across worktrees, include the target task scope, required `docs/PROGRESS.md` and `docs/BACKLOG.md` context, the 300-line file limit, and the verification commands (`pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`) in the task prompt.
  - Workers must verify their changes before calling `orca orchestration worker-done`.
- **Fire-and-Forget Handoff (`orca worktree create --prompt`)**:
  - Use `--prompt` and `--agent` when handing work to a separate Orca worktree without waiting for an orchestration callback.
- **Anti-Slop Rule**:
  - Never use em dashes in worktree comments, PR descriptions, user-facing UI strings, or code comments.
