# React filter example

This compact React 19 example shows enumwaii in a realistic task queue:

- `FILTER` is the extracted `.enum` view, so the reducer and component state
  own branded filter values instead of raw strings.
- `FILTER_METADATA` uses exhaustive `derive` entries for labels, descriptions,
  empty-state copy, and filtering behavior.
- `FILTER_ACTION_CASES` is the extracted `.cases` view. It is used only for
  native discriminated-union reducer tags, so a `switch` narrows each action.
- `filterFromUrl` treats URL/query data as unknown at the boundary and applies
  a nil default plus an invalid-input fallback before state is created.
- `app.test.tsx` uses React DOM server rendering, so the example needs no
  browser, bundler, CSS pipeline, router, or hydration setup.

Files:

- `app.tsx` — enum declarations, parser boundary, reducer, derived metadata,
  and the `FilterPanel` component.
- `app.test.tsx` — parser, reducer, derivation, and server-rendering tests.

From the repository root, run:

```sh
pnpm --filter enumwaii-examples exec vitest run react
pnpm --filter enumwaii-examples run test:types
```
