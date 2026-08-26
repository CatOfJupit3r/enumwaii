type NonEmptyStrings = readonly [string, ...string[]];

type CarrierRaw<TCarrier extends string> = `${TCarrier}`;

type ExactNativeCarrierValues<
  TCarrier extends string,
  TValues extends NonEmptyStrings,
> = CarrierRaw<TCarrier> extends TCarrier
  ? never
  : Exclude<CarrierRaw<TCarrier>, TValues[number]> extends never
    ? Exclude<TValues[number], CarrierRaw<TCarrier>> extends never
      ? unknown
      : never
    : never;

type MemberMap<
  TCarrier extends string,
  TValues extends NonEmptyStrings,
> = Readonly<{
  [K in TValues[number]]: Extract<TCarrier, K>;
}>;

export interface NativeCarrierEnumwaii<
  TCarrier extends string,
  TValues extends NonEmptyStrings,
> {
  readonly enum: MemberMap<TCarrier, TValues>;
  readonly values: readonly TCarrier[];
  readonly parse: (input: unknown) => TCarrier;
  readonly "~type": TCarrier;
  derive<const TValue>(
    mapping: Readonly<Record<TCarrier, TValue>>,
  ): Readonly<Record<TCarrier, TValue>>;
}

export function emNative<TCarrier extends string>() {
  return function createNativeCarrier<const TValues extends NonEmptyStrings>(
    values: TValues & ExactNativeCarrierValues<TCarrier, TValues>,
  ): NativeCarrierEnumwaii<TCarrier, TValues> {
    const memberSet = new Set<string>(values);
    const enumObject = Object.freeze(
      Object.fromEntries(values.map((value) => [value, value])),
    );

    return {
      enum: enumObject as MemberMap<TCarrier, TValues>,
      values: Object.freeze([...values]) as readonly TCarrier[],
      parse(input: unknown): TCarrier {
        if (typeof input === "string" && memberSet.has(input)) {
          return input as TCarrier;
        }
        throw new TypeError(`Unknown enum value: ${String(input)}`);
      },
      derive<const TValue>(
        mapping: Readonly<Record<TCarrier, TValue>>,
      ): Readonly<Record<TCarrier, TValue>> {
        return Object.freeze({ ...mapping });
      },
    } as NativeCarrierEnumwaii<TCarrier, TValues>;
  };
}
