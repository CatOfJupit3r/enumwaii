import type { EnumwaiiParseError } from "../errors/enumwaii-parse-error";

export declare const ENUMWAII_BRAND: unique symbol;
export declare const ENUMWAII_CASES_BRAND: unique symbol;
export declare const ENUMWAII_VALUES_BRAND: unique symbol;

export interface EnumwaiiBrand<
  TIdentity extends string,
  TRaw extends string = string,
> {
  readonly [ENUMWAII_BRAND]: {
    readonly identity: TIdentity;
    readonly raw: TRaw;
    readonly invariant: (identity: TIdentity) => TIdentity;
  };
}

export type EnumwaiiValue<
  TRaw extends string,
  TIdentity extends string = string,
> = TRaw extends string ? TRaw & EnumwaiiBrand<TIdentity, TRaw> : never;

export type EnumwaiiIdentity<TRaw extends string> = `enumwaii:${TRaw}`;

interface EnumwaiiCasesBrand<TIdentity extends string> {
  readonly [ENUMWAII_CASES_BRAND]: TIdentity;
}

interface EnumwaiiValuesBrand<TIdentity extends string> {
  readonly [ENUMWAII_VALUES_BRAND]: TIdentity;
}

export type EnumwaiiCases<TRaw extends string, TIdentity extends string> = {
  readonly [K in TRaw]: K;
} & EnumwaiiCasesBrand<TIdentity>;

export type EnumwaiiValues<
  TValue extends string,
  TIdentity extends string,
> = readonly [TValue, ...TValue[]] & EnumwaiiValuesBrand<TIdentity>;

export type InferEnumwaii<TEnum> = TEnum extends {
  readonly "~type": infer TValue;
}
  ? TValue
  : TEnum extends EnumwaiiSource<infer TRaw, infer TIdentity>
    ? EnumwaiiValue<TRaw, TIdentity>
    : never;

export type InferEnumwaiiCase<TEnum> = TEnum extends {
  readonly "~keys": infer TKeys;
}
  ? TKeys
  : TEnum extends EnumwaiiSource<infer TRaw, infer _TIdentity>
    ? TRaw
    : never;

export interface EnumwaiiSource<
  TRaw extends string = string,
  TIdentity extends string = string,
> {
  readonly rawValues: EnumwaiiValues<TRaw, TIdentity>;
}

export interface EnumwaiiParseOptions<TValue extends string> {
  /** Used only when the input is null or undefined. */
  readonly default?: TValue;
  /** Used for any otherwise-invalid input. */
  readonly fallback?: TValue;
}

export type EnumwaiiSafeParseResult<
  TRaw extends string,
  TIdentity extends string,
> =
  | { readonly success: true; readonly value: EnumwaiiValue<TRaw, TIdentity> }
  | { readonly success: false; readonly error: EnumwaiiParseError };

export interface EnumwaiiDerived<
  TRaw extends string,
  TIdentity extends string,
  TValue,
> {
  readonly get: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue;
  readonly record: Readonly<Record<TRaw, TValue>>;
}

export type EnumwaiiDeriveEntry<
  TRaw extends string,
  TIdentity extends string,
  TValue = unknown,
> = readonly [EnumwaiiValue<TRaw, TIdentity>, TValue];

export type EnumwaiiDeriveToEntry<
  TRaw extends string,
  TIdentity extends string,
  TTargetRaw extends string,
  TTargetIdentity extends string,
> = readonly [
  EnumwaiiValue<TRaw, TIdentity>,
  (
    | EnumwaiiValue<TTargetRaw, TTargetIdentity>
    | readonly EnumwaiiValue<TTargetRaw, TTargetIdentity>[]
  ),
];

type EnumwaiiDeriveEntriesRaw<
  TEntries extends readonly (readonly [string, unknown])[],
  TIdentity extends string,
> = EnumwaiiRawValue<TEntries[number][0], TIdentity>;

type EnumwaiiDuplicateDeriveEntryKeys<
  TEntries extends readonly (readonly [string, unknown])[],
  TSeen extends string = never,
> = TEntries extends readonly [
  readonly [infer TKey extends string, unknown],
  ...infer TRest extends readonly (readonly [string, unknown])[],
]
  ? TKey extends TSeen
    ? TKey | EnumwaiiDuplicateDeriveEntryKeys<TRest, TSeen>
    : EnumwaiiDuplicateDeriveEntryKeys<TRest, TSeen | TKey>
  : never;

export type EnumwaiiValidateDeriveEntries<
  TRaw extends string,
  TIdentity extends string,
  TEntries extends readonly EnumwaiiDeriveEntry<TRaw, TIdentity>[],
> = [Exclude<TRaw, EnumwaiiDeriveEntriesRaw<TEntries, TIdentity>>] extends [
  never,
]
  ? [EnumwaiiDuplicateDeriveEntryKeys<TEntries>] extends [never]
    ? unknown
    : {
        readonly "~enumwaii-error": "Duplicate entry for member";
        readonly member: EnumwaiiDuplicateDeriveEntryKeys<TEntries>;
      }[]
  : {
      readonly "~enumwaii-error": "Missing entry for member";
      readonly member: Exclude<
        TRaw,
        EnumwaiiDeriveEntriesRaw<TEntries, TIdentity>
      >;
    }[];

export type EnumwaiiRawValue<TValue, TIdentity extends string> =
  TValue extends EnumwaiiValue<infer TRaw, TIdentity> ? TRaw : never;
