# New Model Motors

An interactive React Three Fiber world that treats flagship AI model releases as
luxury vehicle launches.

## Development

The project requires the Node.js version in `.nvmrc` and uses pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm install` also installs the repository's Lefthook pre-commit and pre-push
hooks using the project-local executable.

## Quality commands

- `pnpm format` / `pnpm format:write` — check or write formatting
- `pnpm lint` / `pnpm lint:fix` — check lint rules or apply safe fixes
- `pnpm check` / `pnpm check:write` — run all Biome checks, including import
  organization
- `pnpm typecheck` — check TypeScript project references
- `pnpm assets:validate` — run the official glTF validator and confirm the
  recorded runtime GLB measurements
- `pnpm assets:measure` — refresh the runtime GLB measurement record after
  intentionally changing a delivery asset
- `pnpm test:browser` — run the Playwright Chromium smoke tests
- `pnpm validate` — run Biome, type checking, runtime GLB validation, the
  production build, and browser tests
