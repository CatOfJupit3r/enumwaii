import { z } from "zod";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiValue } from "../types/enumwaii";

/** Adapt an enumwaii declaration for APIs that specifically require Zod. */
export function zodSchema<TRaw extends string, TIdentity extends string>(
  enumeration: Enumwaii<TRaw, TIdentity>,
): z.ZodType<EnumwaiiValue<TRaw, TIdentity>> {
  return z.custom<EnumwaiiValue<TRaw, TIdentity>>(
    enumeration.is.bind(enumeration),
    { message: `Expected one of: ${enumeration.rawValues.join(", ")}` },
  );
}
