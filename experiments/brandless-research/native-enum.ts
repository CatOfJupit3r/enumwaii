type StringValues<TEnum extends object> = Extract<TEnum[keyof TEnum], string>;
export interface NativeEnumwaii<TEnum extends object> {
  readonly enum: TEnum;
  readonly values: readonly StringValues<TEnum>[];
  readonly parse: (input: unknown) => StringValues<TEnum>;
  readonly "~type": StringValues<TEnum>;
  derive<const TDerived>(
    mapping: Readonly<Record<StringValues<TEnum>, TDerived>>,
  ): Readonly<Record<StringValues<TEnum>, TDerived>>;
}

export function emFromNativeEnum<const TEnum extends object>(
  enumObject: TEnum,
): NativeEnumwaii<TEnum> {
  type TEnumValue = StringValues<TEnum>;
  const rawValues = Object.values(enumObject);
  if (rawValues.some((value) => typeof value !== "string")) {
    throw new TypeError("emFromNativeEnum accepts string enums only");
  }
  const values = Object.freeze(rawValues) as readonly TEnumValue[];
  const memberSet = new Set<string>(values);

  return {
    enum: enumObject,
    values,
    parse(input: unknown): TEnumValue {
      if (typeof input === "string" && memberSet.has(input)) {
        return input as TEnumValue;
      }
      throw new TypeError(`Unknown enum value: ${String(input)}`);
    },
    derive<const TDerived>(
      mapping: Readonly<Record<TEnumValue, TDerived>>,
    ): Readonly<Record<TEnumValue, TDerived>> {
      return Object.freeze({ ...mapping });
    },
  } as NativeEnumwaii<TEnum>;
}
