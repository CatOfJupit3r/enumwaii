import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiParseError } from "../errors/enumwaii-parse-error";
import type { EnumwaiiValue } from "../types/enumwaii";

export function createStandardSchemaProps<
  TRaw extends string,
  TIdentity extends string,
>(
  isMember: (value: unknown) => value is EnumwaiiValue<TRaw, TIdentity>,
): StandardSchemaV1.Props<unknown, EnumwaiiValue<TRaw, TIdentity>> {
  function validate(
    value: unknown,
  ): StandardSchemaV1.Result<EnumwaiiValue<TRaw, TIdentity>> {
    if (isMember(value)) return { value };
    return {
      issues: [
        {
          message: new EnumwaiiParseError(value).message,
        },
      ],
    };
  }

  return Object.freeze({
    version: 1,
    vendor: "enumwaii",
    validate,
  });
}
