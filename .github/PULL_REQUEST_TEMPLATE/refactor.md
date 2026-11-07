## Refactor Summary

<!-- Concise explanation of what is being refactored and why. -->

## Motivation

<!-- Why is this refactoring needed now? (e.g., modularity, component line limits, type safety, deduplication) -->

## Structural Changes

<!-- Show a file tree, module boundary diagram, or component split overview. -->

```text
path/to/module/
├── before-monolith.vue
└── extracted/
    ├── ChildPartA.vue
    └── ChildPartB.vue
```

### Key Files Changed

| File | Change |
| :--- | :----- |
| ``   |        |

## Behavior Preservation Verification

<!-- How did you verify that external behavior, contracts, and UI states remain unchanged? -->

- `pnpm lint`: `EXIT 0`
- `pnpm typecheck`: `EXIT 0`
- `pnpm exec vitest run`: `EXIT 0`

## Checklist

- [ ] No unintended functional or contract changes introduced
- [ ] Public APIs, props, and emits remain backwards compatible
- [ ] All existing unit and integration tests pass without regression
- [ ] Dead code and unused imports removed

## Related Issues
