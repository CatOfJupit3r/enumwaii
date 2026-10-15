# enumwaii

## 2.0.0

### Major Changes

- [#39](https://github.com/CatOfJupit3r/enumwaii/pull/39) [`40a2adc`](https://github.com/CatOfJupit3r/enumwaii/commit/40a2adc46cb251b0bdaf3c1f089500148f0fbab0) - `emToZodSchema` now returns a native Zod `z.enum` built from the declaration's member object instead of a `z.custom` schema. Its output is still the branded member union, and it now converts with `z.toJSONSchema`, so it works in MCP and model tool definitions without casting a rebuilt `z.enum`.

  Breaking changes for consumers:

  - The `zod` peer range is now `^4.0.0`. Zod 3 is no longer supported by `enumwaii/zod`.
  - The return type is `z.ZodEnum<...>` instead of `z.ZodType<...>`. It is still assignable to `z.ZodType` of the branded union, and it adds `.enum`, `.options`, `.extract()` and `.exclude()`.
  - An invalid value now fails with an `invalid_value` issue (with `values`) instead of a `custom` issue. The message stays `Expected one of: ...`.

  `prefer-native-schema-adapters` now says in its report that the adapter keeps the branded output type.

### Patch Changes

- [#45](https://github.com/CatOfJupit3r/enumwaii/pull/45) [`047f8a7`](https://github.com/CatOfJupit3r/enumwaii/commit/047f8a71ccfa33362f7b535e68fcaab6b123e344) - Drop Deno from the documented runtime support. The ESM entry is no longer tested under Deno, so the README lists only Node.js, Bun, and Cloudflare Workers.

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
