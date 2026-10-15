---
"enumwaii": minor
"eslint-plugin-enumwaii": patch
---

Add `emToZodEnum` to `enumwaii/zod`: a native Zod 4 `z.enum` built from a declaration's member object, with the branded member union as its output. Unlike `emToZodSchema`, it converts with `z.toJSONSchema`, so it works in MCP and model tool definitions without casting a raw `z.enum`. `prefer-native-schema-adapters` now names it in its report.
