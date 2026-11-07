## Summary

<!-- Explain the core purpose of this PR in 1-3 sentences, followed by a compact Mermaid diagram, file tree, or diff-sketch that makes the architectural change immediately clear. -->

```text
path/to/changed-modules/
├── module-a.ts       # brief responsibility
└── module-b.vue      # brief responsibility
```

## Evidence

- **Before:**
  <!-- Describe or paste the failing test, broken state, error log, or screenshot before this change -->
- **After:**
  <!-- Paste actual executed verification commands and results (lint, typecheck, unit/e2e tests, live API checks, or screenshots) -->
  - `pnpm lint`: `EXIT 0`
  - `pnpm typecheck`: `EXIT 0`
  - `pnpm exec vitest run`: `EXIT 0`

## Merge Danger

**Door:** <!-- Two-way (reversible without destructive rollback) or One-way (destructive schema/contract change) -->

<!-- Brief explanation of rollback safety, fallback behavior, or migration idempotency -->

**Blast Radius:** <!-- Low | Medium | High -->

<!-- Modules, database tables, or user flows affected by this merge -->

## Definition of Done (Talenavi SOP)

- [ ] **No Merge Conflict**: Branch is up-to-date with the base branch (`develop` / `main`) and merges cleanly.
- [ ] **Reviewer Approval**: Ready for Peer Developer / Tech Lead review.
- [ ] **Self-Tested**: Verified locally with concrete execution evidence and/or UI screenshots.
- [ ] **API & Schema Docs Updated**: Migrations (`supabase/migrations/`), seed scripts, or API contracts are documented (`N/A` if unchanged).
- [ ] **Quality Gates Passed**: `pnpm lint`, `pnpm typecheck`, and `pnpm exec vitest run` pass with zero errors.
