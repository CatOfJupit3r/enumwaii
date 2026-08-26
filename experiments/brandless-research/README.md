# Brandless/native-literal investigation

This directory is an isolated research prototype. It does not change the published `enumwaii` implementation.

## Experiments

- `representations.ts` checks required, optional, union, phantom, and container-only marker representations.
- `brandless.ts` models native literal members with identity markers only on `.enum`, `.values`, and parser containers.
- `provenance-analyzer.ts` is a test-only TypeScript checker analysis. It derives provenance from declarations, assignments, return/yield expressions, generic type flow, callbacks, iterators, destructuring, spreads, promises, and imports rather than naming `Array`, `Set`, or `Map`.
- `native-carrier.ts` models a generated ambient string-enum carrier while retaining the tuple declaration at runtime.
- `native-enum.ts` models an explicit native TypeScript string-enum input.
- `*.fixture.ts` files are compile-time stress matrices.
- `perf/` contains small, comparable TypeScript representation benchmarks.

The ESLint harness and cross-file fixtures live under `packages/eslint-plugin-enumwaii/test/brandless-*` and `packages/eslint-plugin-enumwaii/test/fixtures/brandless-research/`.

## Commands

From the repository root:

```sh
pnpm exec tsc --version
pnpm exec tsc -p experiments/brandless-research/tsconfig.json
pnpm --filter eslint-plugin-enumwaii test -- brandless-research.test.ts
pnpm --filter eslint-plugin-enumwaii test -- brandless-runtime.test.ts
pnpm --filter eslint-plugin-enumwaii test -- brandless-performance.test.ts
pnpm exec tsc -p experiments/brandless-research/perf/tsconfig.branded.json --extendedDiagnostics
pnpm exec tsc -p experiments/brandless-research/perf/tsconfig.brandless.json --extendedDiagnostics
pnpm exec tsc -p experiments/brandless-research/perf/tsconfig.native-carrier.json --extendedDiagnostics
pnpm exec tsc -p experiments/brandless-research/perf/tsconfig.native-enum.json --extendedDiagnostics
```

The repository-wide validation remains:

```sh
pnpm check
```

## Findings encoded by the fixtures

1. Required value intersections preserve ownership but lose native computed-property behavior.
2. Optional/soft brands preserve raw-string assignability, so they cannot enforce ownership.
3. Container-only markers preserve native literals but ownership is not represented in normal TypeScript flow.
4. Source-aware provenance can distinguish `return value` from `return "ADMIN"` and can propagate through generic library declarations without per-library names. It still needs a path-aware generic-slot model, an explicit trust policy for ambient declarations, mutation/alias handling, and stable diagnostic deduplication before production use.
5. TypeScript string-enum member types are the only tested primitive-string representation that simultaneously rejects raw/foreign values and preserves native keys, exhaustive maps, narrowing, and generic/collection flow. A transparent `em([…])` API cannot synthesize such a nominal carrier with ordinary TypeScript generics; it requires a shared explicit carrier or pre-check code generation/editor tooling.

## Deliberate limitation fixture

`limitations.fixture.ts` records a generic-slot collision where a map key and map value have the same literal type but different provenance. The prototype intentionally reports this as a false positive so the next analyzer iteration must model generic parameter paths rather than collapsing provenance by literal type.
