/**
 * Optional Valibot adapter for integrations that cannot consume Standard
 * Schema directly.
 *
 * @module adapters/valibot
 */

import * as v from "valibot";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiValue } from "../types/enumwaii";

/**
 * Adapts an enumwaii declaration to a Valibot schema for integrations that
 * require Valibot's schema type.
 *
 * The returned custom schema accepts exactly the declaration's runtime string
 * members and infers the branded member union as its output. Use this optional
 * subpath when a Valibot consumer cannot accept the declaration's native
 * Standard Schema implementation; parsing an invalid value follows Valibot's
 * normal issue/error behavior. The `valibot` peer dependency must be installed
 * by the application.
 *
 * @param enumeration Declaration whose membership should be validated.
 * @returns A Valibot custom schema typed as the declaration's branded member
 * union.
 *
 * @example
 * ```ts
 * import { parse } from "valibot";
 * import { valibotSchema } from "enumwaii/valibot";
 *
 * const role = parse(valibotSchema(roles), input);
 * ```
 *
 * @see https://valibot.dev/api/
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export function valibotSchema<TRaw extends string, TIdentity extends string>(
  enumeration: Enumwaii<TRaw, TIdentity>,
) {
  return v.custom<EnumwaiiValue<TRaw, TIdentity>>(
    enumeration.is.bind(enumeration),
    `Expected one of: ${enumeration.rawValues.join(", ")}`,
  );
}
