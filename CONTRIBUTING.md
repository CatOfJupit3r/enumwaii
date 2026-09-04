# Contributing to enumwaii

Thank you for helping make enumwaii safer and easier to use. Focused bug fixes, documentation corrections, integrations, performance evidence, and API design proposals are welcome.

## Before opening work

- Search existing issues and pull requests for the same problem.
- Open an issue before a large API or architecture change so the tradeoffs can be agreed before implementation.
- Keep pull requests focused. Unrelated cleanup is easier to review separately.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Usage questions and troubleshooting belong in the flow described by [SUPPORT.md](SUPPORT.md). Security reports must follow [SECURITY.md](SECURITY.md) and must not be posted publicly.

## Local setup

The workspace requires Node.js 22.18 or newer and pnpm 11. The published packages have their own, broader runtime compatibility ranges.

```sh
git clone https://github.com/CatOfJupit3r/enumwaii.git
cd enumwaii
corepack enable
pnpm install
pnpm check
```

`pnpm install` lets Husky configure the repository's tracked pre-commit hook. The hook checks staged files for whitespace errors and Prettier drift, and it reruns the exact-version policy when dependency manifests are staged. It stays intentionally fast; tests and builds remain CI and pre-push responsibilities. Run `pnpm hooks:install` to restore Husky's local Git configuration.

Useful focused commands:

```sh
pnpm test
pnpm test:types
pnpm lint
pnpm format
pnpm --filter enumwaii test
pnpm --filter eslint-plugin-enumwaii test
pnpm --filter enumwaii-docs dev
pnpm test:runtimes
```

`pnpm check` is the release gate. It checks formatting and lint, runtime and type tests, package skills, builds, emitted JSDoc, publint, and package type resolution. Run it before requesting review.

Examples are versioned in this repository but intentionally live outside the root pnpm workspace so their transitive dependencies do not enter the committed root lockfile. `pnpm check` builds the local `enumwaii` package, installs each example independently without a frozen lockfile, and runs its tests, type checks, and build. Generated example lockfiles are ignored. To work on one example from the repository root, run `pnpm --filter enumwaii build`, then `pnpm --dir examples/<name> install --no-frozen-lockfile` and `pnpm --dir examples/<name> <script>`.

`pnpm test:runtimes` is the opt-in cross-runtime gate and additionally requires Bun 1.4 and Deno 2.9. Cloudflare's local `workerd` binary is installed with the Hono example dependencies. CI installs the pinned Bun and Deno versions for this suite, so they are not prerequisites for ordinary Node-focused work.

## Repository map

- `packages/enumwaii` contains the runtime package, adapters, errors, derivation helpers, tests, and benchmarks.
- `packages/eslint-plugin-enumwaii` contains syntax-only and type-aware rules and their tests.
- `examples` contains independently runnable framework applications.
- `docs` contains both authored documentation and the Fumadocs site. API pages under `docs/api/enumwaii` are generated and must not be edited directly.

## Code and tests

- Match the established TypeScript style and use explicit class-member visibility.
- Define reusable helpers with `function` declarations.
- Preserve enumwaii's central ownership guarantee unless an issue explicitly establishes a replacement with equivalent TypeScript behavior.
- Add runtime tests for behavior changes and type tests for inference or assignability changes.
- Add rule tests for valid, invalid, aliasing, and parser-service boundaries when changing the ESLint plugin.
- Prefer a small real consumer fixture over a type assertion that merely hides an integration problem.

## Documentation

Public exports require useful JSDoc with purpose, boundary behavior, examples, and relevant links. `pnpm test:docs` checks the emitted declaration surface.

The API reference is generated from those comments:

```sh
pnpm --filter enumwaii-docs api:generate
```

Edit authored guides in `docs/*.md`. The docs build runs API generation before Fumadocs, so a local or Pages build cannot silently use stale reference pages.

## Changesets

Add a Changeset for every user-visible change to a published package:

```sh
pnpm changeset
```

Choose the smallest correct release level and explain the consumer-visible effect. Documentation-site, repository-policy, CI-only, and test-only changes that do not affect a published package usually do not need a Changeset.

## Pull requests

A pull request should:

1. explain the problem and the chosen behavior;
2. link its issue when one exists;
3. include tests and documentation appropriate to the change;
4. include a Changeset when a published package changes; and
5. pass `pnpm check`.

Core validation starts on every pull request. Extended validation is queued automatically and waits at the protected `extended-validation` environment until a maintainer approves it. Once approved, it checks the exact current head across all examples, documentation, Node 18, Bun, Deno, and Cloudflare Workers. A new push cancels the older run and requires approval for the new head.

Maintainers may ask to split a pull request when independent changes make its behavior or release impact difficult to review.

## Dependency alert triage

The committed root lockfile intentionally covers only the published packages and documentation workspace. Example manifests remain visible to Dependabot for direct-dependency alerts, while their generated lockfiles are ignored to avoid transitive example alerts. If the repository should suppress those remaining direct alerts too, a maintainer must configure a Dependabot auto-triage rule in **Settings → Code security** that auto-dismisses alerts whose manifest path matches `examples/**`. GitHub stores this rule in repository settings rather than `dependabot.yml`.
