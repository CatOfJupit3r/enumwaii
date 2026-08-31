/**
 * Optional Zod adapter for integrations that cannot consume Standard Schema
 * directly.
 *
 * @module adapters/zod
 */

import { z } from "zod";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiValue } from "../types/enumwaii";

/**
 * Adapts an enumwaii declaration to a Zod schema for integrations that require
 * Zod's schema type.
 *
 * The returned custom schema accepts exactly the declaration's runtime string
 * members and infers the branded member union as its output. Use this optional
 * subpath when a Zod consumer cannot accept the declaration's native Standard
 * Schema implementation; parsing an invalid value follows Zod's normal error
 * behavior. The `zod` peer dependency must be installed by the application.
 *
 * @param enumeration Declaration whose membership should be validated.
 * @returns A Zod schema typed as the declaration's branded member union.
 *
 * @example
 * ```ts
 * import { zodSchema } from "enumwaii/zod";
 *
 * const role = zodSchema(roles).parse(input);
 * ```
 *
 * @see https://zod.dev/
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export function zodSchema<TRaw extends string, TIdentity extends string>(
  enumeration: Enumwaii<TRaw, TIdentity>,
): z.ZodType<EnumwaiiValue<TRaw, TIdentity>> {
  return z.custom<EnumwaiiValue<TRaw, TIdentity>>(
    enumeration.is.bind(enumeration),
    { message: `Expected one of: ${enumeration.rawValues.join(", ")}` },
  );
}
