/**
 * The Standard Schema v1 contract implemented directly by every
 * `Enumwaii` declaration.
 *
 * Most applications can pass an enumwaii declaration straight to a Standard
 * Schema-compatible consumer without naming this type. Import it when writing
 * a generic integration that accepts schemas and should preserve their input
 * and output types; enumwaii re-exports the official specification type for
 * that purpose rather than maintaining a local copy.
 *
 * @example
 * ```ts
 * import { em, type StandardSchemaV1 } from "enumwaii";
 *
 * const roles = em(["ADMIN", "USER"]);
 *
 * function acceptsSchema<TOutput>(
 *   schema: StandardSchemaV1<unknown, TOutput>,
 * ): void {
 *   void schema["~standard"];
 * }
 *
 * acceptsSchema(roles);
 * ```
 *
 * @see https://standardschema.dev/
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export type { StandardSchemaV1 } from "@standard-schema/spec";

export { em } from "./em";
export type { Em } from "./em";
export { Enumwaii } from "./enumwaii";
export { EnumwaiiError } from "./errors/enumwaii-error";
export { EnumwaiiParseError } from "./errors/enumwaii-parse-error";
export type {
  EnumwaiiBrand,
  EnumwaiiCases,
  EnumwaiiDeriveEntry,
  EnumwaiiDerived,
  EnumwaiiDeriveToEntry,
  EnumwaiiIdentity,
  EnumwaiiParseOptions,
  EnumwaiiSafeParseResult,
  EnumwaiiSource,
  EnumwaiiValue,
  EnumwaiiValues,
  InferEnumwaii,
  InferEnumwaiiCase,
} from "./types/enumwaii";
