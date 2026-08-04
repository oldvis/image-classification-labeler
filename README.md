<a href="http://commitizen.github.io/cz-cli/">
    <img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg">
</a>

# OldVis Image Classification Labeler

A web-based data labeling interface for old visualization images ([live demo](https://oldvis.github.io/image-classification-labeler/)).

Assign classification labels: `Vis` / `NotVis`, `Map` / `NotMap`, `Text` / `NotText`, `Table` / `NotTable`, plus `Unsure` / `Confident`.

Annotations are kept in memory for the session.
Use **download** to save `annotations.json`, and **upload** to restore work.

## Development

```bash
pnpm install
pnpm run dev          # http://localhost:3333
```

| Script                | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `pnpm run dev`        | Vite dev server                             |
| `pnpm run build`      | Production build (GitHub Pages `base` path) |
| `pnpm run test`       | Vitest single run                           |
| `pnpm run test:watch` | Vitest watch mode                           |
| `pnpm run test:e2e`   | Playwright (`--ui` for the UI)              |
| `pnpm run lint`       | ESLint                                      |
| `pnpm run typecheck`  | `vue-tsc`                                   |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution notes.

Dataset JSON lives under `src/assets/` (`visualizations.json`, `annotations.json`). The production deploy copies `dist/index.html` to `dist/404.html` for SPA deep links on GitHub Pages.

This repository started from the [vitesse-lite template](https://github.com/antfu/vitesse-lite).
