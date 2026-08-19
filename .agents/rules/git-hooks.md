---
name: No Bypassing Git Hooks
description: Strictly forbids bypassing git pre-commit hooks (e.g. using --no-verify).
trigger: always_on
---

# STRICT RULE: NEVER BYPASS GIT HOOKS

You MUST NEVER use `--no-verify` or `-n` when running `git commit`.
Bypassing git hooks is strictly forbidden because it violates the CI/CD pipeline, Code Quality checks, and Clean Code standards at Talenavi.

If a `git commit` fails due to linter errors (ESLint, Prettier, Husky, TypeScript, etc.):

1. DO NOT bypass the commit.
2. Read the error output carefully.
3. Fix the underlying code or configuration that caused the linter error.
4. Try committing again normally.

**Exceptions**: NONE. Do not bypass it even if you think the linter is giving a false alarm. Fix the linter configuration instead.
