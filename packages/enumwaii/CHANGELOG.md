# enumwaii

## 1.2.0

### Minor Changes

- [#25](https://github.com/CatOfJupit3r/enumwaii/pull/25) [`6a44d1c`](https://github.com/CatOfJupit3r/enumwaii/commit/6a44d1c9e83755e907da041ca868b6f20a3ded14) - Add an optional `enumwaii/nuqs` entry point with `createEnumQueryParser` for branded, validated URL query state.

### Patch Changes

- [#25](https://github.com/CatOfJupit3r/enumwaii/pull/25) [`18759a0`](https://github.com/CatOfJupit3r/enumwaii/commit/18759a09568161418aa3545d44610decf7d1fbe1) - Document and test the JSDoc-preserving object declaration form. Allow fully documented object members through `no-object-em`, including identity mappings, because TypeScript cannot propagate tuple-element comments onto generated `.enum` properties.

## 1.1.0

### Minor Changes

- [#19](https://github.com/CatOfJupit3r/enumwaii/pull/19) [`4a0776b`](https://github.com/CatOfJupit3r/enumwaii/commit/4a0776b70d55cfbbf00b0d921758627bae79b60c) - Add object-form declarations to `em({...})` and `new Enumwaii({...})` so developer-facing keys can map to canonical wire values. Mapped values drive identity, parsing, schemas, adapters, iteration, and derivation; `.enum`, `.rawEnum`, and `.cases` retain the declared keys, as do `.pick()` and `.omit()`. `.extend()` preserves existing aliases while assigning identity keys to new values, and `.combine()` intentionally returns value-keyed members. Empty objects and duplicate mapped values are rejected. Export `EnumwaiiIdentityKeyMap` for the default value-to-key type mapping.

  Allow `enforce-enum-casing` to validate tuple members and object values as `CONSTANT_CASE`, kebab-case, or snake_case while keeping object keys in `CONSTANT_CASE`.

## 1.0.1

### Patch Changes

- [`a864514`](https://github.com/CatOfJupit3r/enumwaii/commit/a8645147b0a04fbf88a0fd6fd4d12f655ff5c58d) - Refresh the npm package README with the new enumwaii branding and current documentation links, and allow compatible `@standard-schema/spec` 1.x releases to be deduplicated in consumer projects.

## 1.0.0

### Major Changes

- [#8](https://github.com/CatOfJupit3r/enumwaii/pull/8) [`a495b26`](https://github.com/CatOfJupit3r/enumwaii/commit/a495b2697291c01cedf8012b93525cb39239f2f2) - Publish the initial stable releases of enumwaii and its ESLint plugin.
