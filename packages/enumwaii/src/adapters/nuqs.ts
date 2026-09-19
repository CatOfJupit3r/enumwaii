/**
 * Optional nuqs adapter for type-safe URL query-state parsing.
 *
 * @module adapters/nuqs
 */

import { createParser } from "nuqs";

import type { Enumwaii } from "../enumwaii";
import type { EnumwaiiIdentityKeyMap, EnumwaiiValue } from "../types/enumwaii";

/**
 * Creates a nuqs parser for an enumwaii declaration.
 *
 * Valid query values are returned as branded enumwaii members.
 * Invalid values follow nuqs parser semantics and resolve to the supplied default.
 * The `nuqs` peer dependency must be installed by the application.
 *
 * @param enumeration Declaration whose members are valid query values.
 * @param defaultValue Owned member used when the query value is absent or invalid.
 * @returns A nuqs parser with the declaration's branded output type and default.
 *
 * @example
 * ```ts
 * import { createEnumwaiiQueryParser } from "enumwaii/nuqs";
 *
 * const roleParser = createEnumwaiiQueryParser(roles, roles.enum.USER);
 * ```
 *
 * @see https://nuqs.dev/docs/parsers/making-your-own
 */
export function createEnumwaiiQueryParser<
  TRaw extends string,
  TIdentity extends string,
  TKeys extends Readonly<Record<string, string>> = EnumwaiiIdentityKeyMap<TRaw>,
>(
  enumeration: Enumwaii<TRaw, TIdentity, TKeys>,
  defaultValue: EnumwaiiValue<TRaw, TIdentity>,
) {
  return createParser<EnumwaiiValue<TRaw, TIdentity>>({
    parse(value) {
      const result = enumeration.safeParse(value);
      return result.success ? result.value : null;
    },
    serialize: (value) => value,
  }).withDefault(defaultValue);
}
