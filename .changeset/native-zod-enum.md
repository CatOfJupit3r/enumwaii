---
"enumwaii": major
"eslint-plugin-enumwaii": patch
---

`emToZodSchema` now returns a native Zod `z.enum` built from the declaration's member object instead of a `z.custom` schema. Its output is still the branded member union, and it now converts with `z.toJSONSchema`, so it works in MCP and model tool definitions without casting a rebuilt `z.enum`.

Breaking changes for consumers:

- The `zod` peer range is now `^4.0.0`. Zod 3 is no longer supported by `enumwaii/zod`.
- The return type is `z.ZodEnum<...>` instead of `z.ZodType<...>`. It is still assignable to `z.ZodType` of the branded union, and it adds `.enum`, `.options`, `.extract()` and `.exclude()`.
- An invalid value now fails with an `invalid_value` issue (with `values`) instead of a `custom` issue. The message stays `Expected one of: ...`.

`prefer-native-schema-adapters` now says in its report that the adapter keeps the branded output type.
