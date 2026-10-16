---
"eslint-plugin-enumwaii": patch
---

`no-enumwaii-case-misuse` and `prefer-native-schema-adapters` run their syntactic checks before asking the TypeScript checker for a type. `no-enumwaii-case-misuse` no longer resolves the type of identifiers it never reports (imports, declarations, member objects and properties, parameters and type positions), resolves a member object's type only for member accesses it could report, and remembers its cases-brand decision per TypeScript type. `prefer-native-schema-adapters` resolves a call signature only when the method name is a Zod or Valibot schema factory. Findings are unchanged.
