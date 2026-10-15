/**
 * Optional Zod adapter for integrations that cannot consume Standard Schema
 * directly.
 *
 * @module adapters/zod
 */

import { z } from "zod";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiIdentityKeyMap } from "../types/enumwaii";

/**
 * Adapts an enumwaii declaration to a native Zod enum schema whose output is the branded member union.
 *
 * The returned schema is a real `z.enum` built from the declaration's member object. It accepts exactly the declaration's runtime string members,
 * keeps object declaration keys on its `.enum` view, and converts with `z.toJSONSchema` to a string enum, so it also works in MCP and model tool definitions.
 * Use this optional subpath when a Zod consumer cannot accept the declaration's native Standard Schema implementation.
 * An invalid value fails with Zod's `invalid_value` issue and the message `Expected one of: ...`.
 * The `zod` peer dependency (Zod 4) must be installed by the application.
 *
 * @param enumeration Declaration whose members become the enum's entries.
 * @returns A Zod enum schema typed as the declaration's branded member union.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { emToZodSchema } from "enumwaii/zod";
 *
 * const roleSchema = emToZodSchema(roles);
 * const role = roleSchema.parse(input);
 * const jsonSchema = z.toJSONSchema(roleSchema);
 * ```
 *
 * @see https://zod.dev/api#enums
 * @see https://zod.dev/json-schema
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export function emToZodSchema<
  TRaw extends string,
  TIdentity extends string,
  TKeys extends Readonly<Record<string, string>> = EnumwaiiIdentityKeyMap<TRaw>,
>(enumeration: Enumwaii<TRaw, TIdentity, TKeys>) {
  return z.enum(enumeration.enum, {
    error: `Expected one of: ${enumeration.rawValues.join(", ")}`,
  });
}
