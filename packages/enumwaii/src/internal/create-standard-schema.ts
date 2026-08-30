import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiParseError } from "../errors/enumwaii-parse-error";
import type { EnumwaiiValue } from "../types/enumwaii";

/** Minimal membership contract used by the internal Standard Schema adapter. */
interface EnumwaiiMembership<TRaw extends string, TIdentity extends string> {
  is(value: unknown): value is EnumwaiiValue<TRaw, TIdentity>;
}

function validateStandardSchema<TRaw extends string, TIdentity extends string>(
  this: EnumwaiiMembership<TRaw, TIdentity>,
  value: unknown,
): StandardSchemaV1.Result<EnumwaiiValue<TRaw, TIdentity>> {
  if (this.is(value)) return { value };
  return {
    issues: [
      {
        message: new EnumwaiiParseError(value).message,
      },
    ],
  };
}

/**
 * Builds the frozen Standard Schema v1 metadata attached to an enumwaii
 * declaration.
 *
 * This is an internal support helper, not a package-addressable consumer API.
 * Validation is deliberately strict: it delegates only to `is`, returning a
 * value for a member or protocol issues for an invalid input. Parse recovery
 * options such as defaults and fallbacks are not part of Standard Schema
 * validation. Building an issue uses the same non-throwing diagnostic as
 * `Enumwaii.parse`, including for values such as `bigint`, circular
 * structures, and hostile proxies.
 *
 * @param enumeration Membership implementation to bind as the validator's
 * receiver.
 * @returns Frozen Standard Schema metadata for the declaration.
 *
 * @see https://standardschema.dev/
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/runtime-boundaries.md#standard-schema
 */
export function createStandardSchemaProps<
  TRaw extends string,
  TIdentity extends string,
>(
  enumeration: EnumwaiiMembership<TRaw, TIdentity>,
): StandardSchemaV1.Props<unknown, EnumwaiiValue<TRaw, TIdentity>> {
  return Object.freeze({
    version: 1,
    vendor: "enumwaii",
    validate: (validateStandardSchema<TRaw, TIdentity>).bind(enumeration),
  });
}
