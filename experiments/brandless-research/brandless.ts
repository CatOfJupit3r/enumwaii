export const ENUMWAII_ENUM_IDENTITY: unique symbol = Symbol(
  "enumwaii.enum.identity",
);
export const ENUMWAII_VALUES_IDENTITY: unique symbol = Symbol(
  "enumwaii.values.identity",
);
export const ENUMWAII_PARSE_IDENTITY: unique symbol = Symbol(
  "enumwaii.parse.identity",
);

type NonEmptyStrings = readonly [string, ...string[]];
type RawOf<TValues extends NonEmptyStrings> = TValues[number];
type IdentityRecord<TRaw extends string> = Readonly<Record<TRaw, true>>;

export type BrandlessEnum<TRaw extends string> = Readonly<{
  [K in TRaw]: K;
}> & {
  readonly [ENUMWAII_ENUM_IDENTITY]: IdentityRecord<TRaw>;
};

export type BrandlessValues<TRaw extends string> = readonly [
  TRaw,
  ...TRaw[],
] & {
  readonly [ENUMWAII_VALUES_IDENTITY]: IdentityRecord<TRaw>;
};

export type OwnedParser<TRaw extends string> = ((input: unknown) => TRaw) & {
  readonly [ENUMWAII_PARSE_IDENTITY]: IdentityRecord<TRaw>;
};

export interface BrandlessDerived<TRaw extends string, TValue> {
  readonly get: (value: TRaw) => TValue;
  readonly record: Readonly<Record<TRaw, TValue>>;
}

export interface BrandlessEnumwaii<TRaw extends string> {
  readonly enum: BrandlessEnum<TRaw>;
  readonly values: BrandlessValues<TRaw>;
  readonly parse: OwnedParser<TRaw>;
  readonly "~type": TRaw;
  derive<const TValue>(
    mapping: Readonly<Record<TRaw, TValue>>,
  ): BrandlessDerived<TRaw, TValue>;
}

function attachIdentity<T extends object>(
  value: T,
  key: symbol,
  members: readonly string[],
): T {
  Object.defineProperty(value, key, {
    configurable: false,
    enumerable: false,
    value: Object.freeze(
      Object.fromEntries(members.map((member) => [member, true])),
    ),
    writable: false,
  });
  return value;
}

export function em<const TValues extends NonEmptyStrings>(
  inputValues: TValues,
): BrandlessEnumwaii<RawOf<TValues>> {
  type TRaw = RawOf<TValues>;

  const mutableValues = [...new Set(inputValues)];
  attachIdentity(mutableValues, ENUMWAII_VALUES_IDENTITY, mutableValues);
  const values = Object.freeze(
    mutableValues,
  ) as unknown as BrandlessValues<TRaw>;

  const enumObject = Object.freeze(
    attachIdentity(
      Object.fromEntries(values.map((value) => [value, value])),
      ENUMWAII_ENUM_IDENTITY,
      values,
    ),
  ) as BrandlessEnum<TRaw>;
  const memberSet = new Set<string>(values);

  const parse = ((input: unknown): TRaw => {
    if (typeof input === "string" && memberSet.has(input)) {
      return input as TRaw;
    }
    throw new TypeError(`Unknown enum value: ${String(input)}`);
  }) as OwnedParser<TRaw>;
  attachIdentity(parse, ENUMWAII_PARSE_IDENTITY, values);

  return {
    enum: enumObject,
    values,
    parse,
    derive<const TValue>(
      mapping: Readonly<Record<TRaw, TValue>>,
    ): BrandlessDerived<TRaw, TValue> {
      return Object.freeze({
        get: (value: TRaw) => mapping[value],
        record: Object.freeze({ ...mapping }),
      });
    },
  } as BrandlessEnumwaii<TRaw>;
}
