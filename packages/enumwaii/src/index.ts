/**
 * Core enumwaii declarations, member views, parsing, composition, errors, and
 * public utility types.
 *
 * Start with {@link em} for ordinary declarations. The exported
 * {@link Enumwaii} class is also available for generic wrappers and explicit
 * construction.
 *
 * @module core
 */

export { em } from "./em";
export type { Em } from "./em";
export { Enumwaii } from "./enumwaii";
export { EnumwaiiError } from "./errors/enumwaii-error";
export { EnumwaiiParseError } from "./errors/enumwaii-parse-error";
export type {
  EnumwaiiBrand,
  EnumwaiiCases,
  EnumwaiiDeriveBuilder,
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
