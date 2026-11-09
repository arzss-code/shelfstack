# ShelfStack — Agent Engineering Rules

## Purpose

ShelfStack is a production-oriented e-commerce application.

The goal is to demonstrate sound software engineering practices:
correctness, data integrity, security, reliability, observability,
performance, testing, and deployability.

Do not treat ShelfStack as a literal clone of Shopee/Tokopedia.
Use proven patterns appropriate to the current workload and architecture.

## Current Stack

- Nuxt 4 / Vue 3
- TypeScript
- Nitro
- Supabase / PostgreSQL
- Redis
- BullMQ (`order-expiry` delayed queue, repeatable reconciliation sweep, exponential retry, dan `order-expiry-dlq` di `@shelfstack/order-service`)
- Fastify
- Zod
- Pino
- Docker / Docker Compose
- GitHub Actions (`.github/workflows/ci.yml`: lint → typecheck → build → vitest → compose validate)
- Vitest
- Playwright
- Midtrans (Sandbox; tidak ada lapisan mock di kode)

## Commands

- `pnpm typecheck` — `nuxi typecheck` (pemeriksa real atas proyek app + server, harus EXIT 0)
- `pnpm lint` / `pnpm lint:fix` — ESLint (0 error; warning `vue/html-self-closing` masih ada ~32)
- `pnpm exec vitest run` — unit suite (33 file / 310 test, semua lolos per 2026-10-11). Jangan `pnpm test` untuk sekali jalan (itu watch mode)
- `pnpm test:e2e` — Playwright (`tests/e2e/`)
- `pnpm build` — verifikasi production build

## Package Manager

Repo ini memakai **pnpm saja**. Aturan keras, tanpa pengecualian:

- Jangan pernah memakai `npm`, `npx`, `yarn`, atau `bun` — di perintah, script, hook, config MCP, maupun dokumentasi.
- Tool sekali jalan: `pnpm dlx <paket>` (pengganti `npx`).
- Binary lokal project: `pnpm exec <bin>` (pengganti `npx <bin>`).
- Workspace/service: `pnpm --filter <nama-paket> <script>`.
- Install/CI: `pnpm install --frozen-lockfile`. Jangan commit tanpa `pnpm-lock.yaml` yang sinkron.

## Documentation Hierarchy

Sumber kebenaran berlapis (jangan mengarang klaim di luar ini):

1. `docs/PROGRESS.md` — status pengerjaan terkini + "Known Gaps". Wajib dibaca sebelum kerja.
2. `docs/BACKLOG.md` — scope + acceptance criteria (ID stabil, jangan diganti).
3. `docs/README.md` — indeks semua dokumen.
4. `DESIGN.md` (root): design system aktif. Dokumen legacy diarsipkan di `docs/archive/`.
5. `docs/MCP-SETUP.md` — setup tooling OpenCode (global vs per-project).
6. `docs/ADR/` — keputusan arsitektur yang sudah disahkan.

## MCP Tooling

- Supabase MCP selalu `--read-only`. Jangan tulis skema/data lewat MCP; perubahan skema hanya via migrasi `supabase/migrations/`.
- `project-ref` per project hidup di `opencode.json` masing-masing repo; token tidak pernah masuk repo/chat.

## Orca Workspace & Orchestration

- `orca.yaml` (di root repo) mengatur setup worktree otomatis (`pnpm install --frozen-lockfile`, `setupAgentStartupPolicy: wait-for-setup`), default tab (`Dev Server`), dan template `issueCommand` berbasis 4-Gate.
- `.worktreeinclude` menyalin file lokal yang di-ignore Git (`.env`, `.mcp.json`) ke child worktree Orca baru agar `server/plugins/00.env-guard.ts` dapat memvalidasi environment saat boot tanpa mengekspos secret ke Git.
- Aturan operasional lengkap untuk `orca` CLI, worktree, dan multi-agent orchestration terdokumentasi di `.agents/rules/orca-workflow.md`.

## Mandatory Workflow

Before coding:

1. Inspect the existing repository.
2. Search for the current implementation.
3. Inspect relevant database schema and migrations.
4. Inspect existing tests.
5. Identify affected files and dependencies.
6. Explain the proposed implementation before making a broad change.

During coding:

1. Make the smallest coherent change.
2. Preserve working behavior unless a behavior change is required.
3. Do not modify unrelated files.
4. Never silently change database schema; use migrations.
5. Never expose secrets to the client.
6. Never trust client-side price, inventory, payment status, or authorization.
7. Keep critical business operations transactional.
8. Use deterministic lock ordering when multiple rows are locked.
9. Make retryable operations idempotent where duplicate execution is possible.
10. Prefer database-enforced invariants where practical.

After coding:

1. Run relevant tests.
2. Run typecheck and lint when applicable.
3. Review concurrency and transaction boundaries.
4. Review security and authorization.
5. Review cache consistency.
6. Review failure and retry behavior.
7. Report only tests that were actually executed.
8. Report remaining risks honestly.

## Source of Truth

PostgreSQL is authoritative for:

- inventory
- order state
- payment state
- transactional business data

Redis is a performance layer, not the source of truth.

The frontend is never authoritative for:

- price
- stock
- payment state
- user role
- permissions

## Order and Payment

Keep order state and payment state separate.

Do not allow arbitrary state transitions.

Every critical transition must define:

- current state
- next state
- actor/system
- side effects
- inventory consequences
- payment consequences

## Inventory

Critical inventory mutations must be atomic and auditable.

When reservation logic is implemented, distinguish:

- on_hand
- reserved
- available

Do not introduce a new inventory model without first inspecting the
current schema and order flow.

## Payment

Payment webhook handling must be:

- signature verified
- idempotent
- safe against duplicate delivery
- safe against stale/out-of-order events
- safe against cancellation/expiry races

Payment processing must not blindly overwrite a terminal order state.

## API and Security

Every new endpoint must be reviewed for:

- authentication
- authorization
- ownership
- input validation
- rate limiting where appropriate
- injection risks
- sensitive data exposure
- replay/duplicate request risks

Admin authorization must be enforced server-side.

Use Zod or equivalent validation at server boundaries.

Never log passwords, tokens, secrets, or unnecessary sensitive data.

## Async Jobs

BullMQ jobs are assumed to be at-least-once.

Therefore jobs must:

- be idempotent
- validate current database state
- tolerate retries
- expose failures
- use DLQ where appropriate

## Caching

Redis caching must not compromise correctness.

Consider:

- cache invalidation
- stale data
- cache stampede
- cache penetration
- user-specific data isolation

## Testing

Business-critical features should consider:

1. happy path
2. validation failure
3. unauthorized request
4. not found
5. duplicate request
6. concurrent request
7. transaction failure
8. external service failure
9. retry
10. state transition conflict

Use real PostgreSQL integration tests for concurrency-sensitive logic
where practical.

## No Fabricated Claims

Do not claim:

- "100% deadlock-free"
- "Shopee-grade"
- "Tokopedia-grade"
- "production-ready"

unless evidence supports the exact claim.

Do not fabricate:

- test results
- benchmark results
- deployment results
- monitoring results

## STOP Conditions

Stop and request review if:

1. A migration could destroy or invalidate existing data.
2. An order/payment/inventory invariant is unclear.
3. A change requires a major architectural boundary change.
4. A destructive migration is required.
5. Existing behavior conflicts with the requested design.
6. Payment behavior has two plausible interpretations.
7. New external infrastructure is required without a clear requirement.
8. Security implications are unclear.
9. A concurrency issue cannot be demonstrated safe.
10. Tests cannot reliably reproduce a critical correctness requirement.

## Completion Standard

A task is complete only when:

- implementation exists
- relevant migrations are valid
- typecheck passes where applicable
- lint passes where applicable
- relevant tests pass
- edge cases are considered
- no unrelated functionality is broken

## Pull Request & Branch Standards

- **Branch Naming**: Use descriptive, domain-scoped branch names (`feat/<domain-slug>`, `fix/<domain-slug>`, `hotfix/<domain-slug>`, `refactor/<domain-slug>`, `chore/<domain-slug>`, `docs/<domain-slug>`). Never use `production` in feature branch names.
- **PR Templates**: Every Pull Request must follow `.github/PULL_REQUEST_TEMPLATE.md` or the specialized templates in `.github/PULL_REQUEST_TEMPLATE/` (`feature.md`, `bugfix.md`, `hotfix.md`, `refactor.md`, `docs.md`).
- **Public Repo Hygiene**: Never reference internal company SOP labels (e.g., "Talenavi SOP") in public PR descriptions, `.github/` templates, or issues. See `.agents/rules/pr-template-standards.md` for details.

## Change Report

End meaningful implementation tasks with:

### Objective

What was changed.

### Files Changed

Exact files.

### Database Changes

Migrations/schema changes.

### API Changes

Endpoints/contracts changed.

### Business Logic Changes

State, inventory, payment, or other behavior.

### Tests Added

New tests.

### Tests Executed

Commands and actual results.

### Security Impact

Relevant security changes.

### Concurrency Impact

Relevant locking/atomicity changes.

### Performance Impact

Measured or expected impact. Do not invent measurements.

### Remaining Risks

Known gaps.

### Follow-up

Recommended next work.

<!-- antislop:start -->

## antislop

Mode: DURING (ditetapkan pemilik repo — terapkan aturan saat bekerja, bukan sesudah).

Untuk kerja UI, copywriting, aksesibilitas, layout mobile, atau komentar kode, baca filter inti
`C:\Users\ARYA\.opencode\skills\antislop\SKILL.md` lalu skill sesuai tugas (bila tersedia di rilis yang sama):

- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- Orang & aksesibilitas: `skills/antislop-human/SKILL.md`
- Layout mobile: `skills/antislop-layoutmobile/SKILL.md`
- Komentar kode: `skills/antislop-code/SKILL.md` (hapus komentar generik AI-slop, pertahankan yang bernilai, jangan sentuh kode)

Aturan keras yang selalu berlaku di repo ini, tanpa perlu diminta ulang:

- Tanpa em dash (—) di teks user-facing dan komentar kode. Pakai koma, titik, titik dua, atau kurung.
- Tanpa klaim fabrikasi (angka, testimoni, status tanpa bukti).
- Setiap klaim bukti-backup (file:line) dan setiap perubahan terverifikasi eksekusi sebelum dilaporkan.

<!-- antislop:end -->
