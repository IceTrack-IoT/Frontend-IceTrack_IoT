---
paths:
  - "src/**/*.spec.ts"
  - "src/**/*.test.ts"
  - "src/app/**/*.ts"
  - "package.json"
  - "angular.json"
  - "vitest.config.*"
  - "jest.config.*"
  - "playwright.config.*"
  - "cypress.config.*"
---

# Testing and Validation Rules

## Test strategy

Follow the test runner, tooling, and test conventions already configured in the repository.

Do not add a test dependency, test runner, assertion library, browser testing tool, or accessibility-testing package without explicit approval.

Prioritize observable behavior over implementation details.

## What to test

Test the narrowest suitable layer.

| Change | Preferred test scope |
|---|---|
| Value object, entity, pure domain rule | Domain unit test |
| Use case | Unit test with mocked application ports |
| Store state/update behavior | Store unit test |
| HTTP mapping or adapter behavior | Infrastructure adapter test if existing patterns support it |
| Form validation, interaction, conditional rendering | Component test |
| Route authorization/redirection | Guard/route test if supported |
| Styling-only adjustment | Usually no automated test required |
| Translation-only change | Verify both locale files; add test only if project convention requires it |

## Required behavior coverage

Add or update tests when a change:

- Adds or changes a domain rule.
- Adds or changes a use case.
- Changes error handling.
- Changes store state transitions.
- Adds a form or form validation behavior.
- Adds a protected route or changes route guards.
- Changes alert actions or service request state-related UI.
- Changes session/authentication behavior.
- Changes report generation/status behavior.
- Fixes a regression.
- Changes a reusable shared component or utility.

## Store tests

When relevant, test:

- Initial state.
- Loading state.
- Success/populated state.
- Empty state.
- Error state.
- Error reset or retry.
- Pending/submitting behavior.
- Duplicate action prevention.
- State reset/cleanup.

Test public store methods and exposed signals/computed values, not private implementation details.

## Component tests

When relevant, test:

- Visible user behavior.
- Inputs and outputs.
- Loading, empty, error, and populated states.
- Typed Reactive Form validation.
- Pending/disabled submission behavior.
- Translated accessible names/labels.
- Keyboard/focus behavior for interactive flows.
- Confirmation behavior for destructive actions.

Avoid brittle tests tied to generated CSS classes or incidental DOM structure.

## Validation commands

- Inspect `package.json` before choosing a command.
- Use the narrowest applicable validation command.
- Do not run `ng serve`.
- Do not run `ng build` unless explicitly requested or listed as an approved validation command.
- Do not run destructive commands.
- Do not change lockfiles unless a dependency change was approved.
- Do not claim success unless the command completed successfully.

Use actual project scripts only.

Potential examples, only if they exist:

```bash
pnpm run lint
pnpm run test
pnpm run test -- --watch=false
pnpm run test -- --coverage=false
```

## If validation cannot run

State:

1. The command that was not run.
2. The reason.
3. What was reviewed instead.
4. Remaining risk or limitation.
