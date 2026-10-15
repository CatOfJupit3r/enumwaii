/**
 * Optional Zod adapter for integrations that cannot consume Standard Schema
 * directly.
 *
 * @module adapters/zod
 */

import { z } from "zod";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiIdentityKeyMap, EnumwaiiValue } from "../types/enumwaii";

/**
 * Adapts an enumwaii declaration to a Zod schema for integrations that require Zod's schema type.
 *
 * The returned custom schema accepts exactly the declaration's runtime string members and infers the branded member union as its output.
 * Use this optional subpath when a Zod consumer cannot accept the declaration's native Standard Schema implementation;
 * parsing an invalid value follows Zod's normal error behavior.
 * The `zod` peer dependency must be installed by the application.
 *
 * @param enumeration Declaration whose membership should be validated.
 * @returns A Zod schema typed as the declaration's branded member union.
 *
 * @example
 * ```ts
 * import { emToZodSchema } from "enumwaii/zod";
 *
 * const role = emToZodSchema(roles).parse(input);
 * ```
 *
 * @see https://zod.dev/
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export function emToZodSchema<
  TRaw extends string,
  TIdentity extends string,
  TKeys extends Readonly<Record<string, string>> = EnumwaiiIdentityKeyMap<TRaw>,
>(
  enumeration: Enumwaii<TRaw, TIdentity, TKeys>,
): z.ZodType<EnumwaiiValue<TRaw, TIdentity>> {
  return z.custom<EnumwaiiValue<TRaw, TIdentity>>(
    enumeration.is.bind(enumeration),
    { message: `Expected one of: ${enumeration.rawValues.join(", ")}` },
  );
}

/**
 * Adapts an enumwaii declaration to a native Zod enum schema whose output is the branded member union.
 *
 * Unlike {@link emToZodSchema}, the returned schema is a real `z.enum` built from the declaration's member object,
 * so tools that introspect Zod schemas, such as `z.toJSONSchema` and model or MCP tool definitions, describe it as a string enum.
 * Parsing accepts exactly the declaration's runtime string members, and the brand stays compile-time only.
 * Object declarations keep their public keys on the schema's `.enum` view.
 * This adapter requires Zod 4; on Zod 3, use {@link emToZodSchema}.
 *
 * @param enumeration Declaration whose members become the enum's entries.
 * @returns A Zod enum schema typed as the declaration's branded member union.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { emToZodEnum } from "enumwaii/zod";
 *
 * const roleSchema = emToZodEnum(roles);
 * const role = roleSchema.parse(input);
 * const jsonSchema = z.toJSONSchema(roleSchema);
 * ```
 *
 * @see https://zod.dev/api#enums
 * @see https://zod.dev/json-schema
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/adapters.mdx
 */
export function emToZodEnum<
  TRaw extends string,
  TIdentity extends string,
  TKeys extends Readonly<Record<string, string>> = EnumwaiiIdentityKeyMap<TRaw>,
>(enumeration: Enumwaii<TRaw, TIdentity, TKeys>) {
  return z.enum(enumeration.enum);
}
