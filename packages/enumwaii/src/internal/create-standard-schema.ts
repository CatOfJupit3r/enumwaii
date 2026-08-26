import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiParseError } from "../errors/enumwaii-parse-error";
import type { EnumwaiiValue } from "../types/enumwaii";

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
