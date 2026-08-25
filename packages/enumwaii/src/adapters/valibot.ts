import * as v from "valibot";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiValue } from "../types/enumwaii";

/** Adapt an enumwaii declaration for APIs that specifically require Valibot. */
export function valibotSchema<TRaw extends string, TIdentity extends string>(
  enumeration: Enumwaii<TRaw, TIdentity>,
) {
  return v.custom<EnumwaiiValue<TRaw, TIdentity>>(
    enumeration.is.bind(enumeration),
    `Expected one of: ${enumeration.rawValues.join(", ")}`,
  );
}
