# eslint-plugin-enumwaii

## 1.1.0

### Minor Changes

- [#19](https://github.com/CatOfJupit3r/enumwaii/pull/19) [`4a0776b`](https://github.com/CatOfJupit3r/enumwaii/commit/4a0776b70d55cfbbf00b0d921758627bae79b60c) - Add object-form declarations to `em({...})` and `new Enumwaii({...})` so developer-facing keys can map to canonical wire values. Mapped values drive identity, parsing, schemas, adapters, iteration, and derivation; `.enum`, `.rawEnum`, and `.cases` retain the declared keys, as do `.pick()` and `.omit()`. `.extend()` preserves existing aliases while assigning identity keys to new values, and `.combine()` intentionally returns value-keyed members. Empty objects and duplicate mapped values are rejected. Export `EnumwaiiIdentityKeyMap` for the default value-to-key type mapping.

  Allow `enforce-enum-casing` to validate tuple members and object values as `CONSTANT_CASE`, kebab-case, or snake_case while keeping object keys in `CONSTANT_CASE`.

- [#19](https://github.com/CatOfJupit3r/enumwaii/pull/19) [`8711751`](https://github.com/CatOfJupit3r/enumwaii/commit/871175195af1a42a503d48624e474c795e979ddb) - Add the public `no-object-em` and type-aware `no-manual-enum` rules. All recommended presets now use `no-object-em` to prefer array declarations while allowing narrowly documented external-contract or compatibility exceptions. The type-checked presets now use `no-manual-enum` to report hand-built string unions, discriminants, and const-container vocabularies that should be owned by enumwaii. Both rules support shared, rationale-required declaration-name exceptions and intentionally provide no autofix.

- [#19](https://github.com/CatOfJupit3r/enumwaii/pull/19) [`0931a45`](https://github.com/CatOfJupit3r/enumwaii/commit/0931a45b1038a4c21dd0a99fb62e2c446cbc104c) - Allow `enforce-enum-casing` to ignore declarations by name or file wildcard patterns.

## 1.0.1

### Patch Changes

- [`a864514`](https://github.com/CatOfJupit3r/enumwaii/commit/a8645147b0a04fbf88a0fd6fd4d12f655ff5c58d) - Refresh the npm package README and allow compatible `@typescript-eslint/utils` 8.x releases to be deduplicated in consumer projects.

## 1.0.0

### Major Changes

- [#8](https://github.com/CatOfJupit3r/enumwaii/pull/8) [`a495b26`](https://github.com/CatOfJupit3r/enumwaii/commit/a495b2697291c01cedf8012b93525cb39239f2f2) - Publish the initial stable releases of enumwaii and its ESLint plugin.
