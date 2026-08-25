import { Enumwaii } from "./enumwaii";
import type { EnumwaiiIdentity, EnumwaiiSource } from "./types/enumwaii";

type NonEmptyStrings = readonly [string, ...string[]];
type RawOf<TValues extends NonEmptyStrings> = TValues[number];
type SourceRaw<TSource> =
  TSource extends EnumwaiiSource<infer TRaw, infer _TIdentity> ? TRaw : never;

export interface Em {
  <const TValues extends NonEmptyStrings>(
    rawValues: TValues,
  ): Enumwaii<RawOf<TValues>, EnumwaiiIdentity<RawOf<TValues>>>;
  combine: <
    const TSources extends readonly [EnumwaiiSource, ...EnumwaiiSource[]],
  >(
    sources: TSources,
  ) => Enumwaii<
    SourceRaw<TSources[number]>,
    EnumwaiiIdentity<SourceRaw<TSources[number]>>
  >;
}

function createEnumwaii(rawValues: NonEmptyStrings): Enumwaii<string, string> {
  return new Enumwaii(rawValues);
}

function combineEnumwaii<
  const TSources extends readonly [EnumwaiiSource, ...EnumwaiiSource[]],
>(
  sources: TSources,
): Enumwaii<
  SourceRaw<TSources[number]>,
  EnumwaiiIdentity<SourceRaw<TSources[number]>>
> {
  const values = sources.flatMap((source) => source.rawValues);
  return new Enumwaii(values as never);
}

export const em = Object.assign(createEnumwaii, {
  combine: combineEnumwaii,
}) as Em;
