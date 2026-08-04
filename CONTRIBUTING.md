# Contributing

Thanks for being interested in contributing to this project!

## Setup

```bash
pnpm install
pnpm run dev
```

## Checks before opening a PR

```bash
pnpm run lint --fix
pnpm run typecheck
pnpm run test
pnpm run test:e2e
```

CI runs the same suite (build, unit tests, Playwright, lint, typecheck) on Ubuntu and Windows.

## Code style

Use `pnpm run lint --fix` to fix style issues before committing.

## Thanks

Thank you again for being interested in this project! You are awesome!
