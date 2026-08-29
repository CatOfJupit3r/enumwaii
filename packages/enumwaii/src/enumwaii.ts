import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiError } from "./errors/enumwaii-error";
import { EnumwaiiParseError } from "./errors/enumwaii-parse-error";
import { createStandardSchemaProps } from "./internal/create-standard-schema";
import type {
  EnumwaiiCases,
  EnumwaiiDeriveEntry,
  EnumwaiiDerived,
  EnumwaiiDeriveToEntry,
  EnumwaiiIdentity,
  EnumwaiiParseOptions,
  EnumwaiiRawValue,
  EnumwaiiSafeParseResult,
  EnumwaiiValue,
  EnumwaiiValidateDeriveEntries,
  EnumwaiiValues,
} from "./types/enumwaii";

export class Enumwaii<
  TRaw extends string,
  TIdentity extends string = EnumwaiiIdentity<TRaw>,
> implements StandardSchemaV1<unknown, EnumwaiiValue<TRaw, TIdentity>> {
  public readonly enum: {
    readonly [K in TRaw]: EnumwaiiValue<K, TIdentity>;
  };
  public readonly rawEnum: {
    readonly [K in TRaw]: K;
  };
  public readonly cases: EnumwaiiCases<TRaw, TIdentity>;
  public readonly values: EnumwaiiValues<
    EnumwaiiValue<TRaw, TIdentity>,
    TIdentity
  >;
  public readonly rawValues: EnumwaiiValues<TRaw, TIdentity>;
  public readonly "~standard": StandardSchemaV1<
    unknown,
    EnumwaiiValue<TRaw, TIdentity>
  >["~standard"];
  declare public readonly "~keys": TRaw;
  declare public readonly "~type": EnumwaiiValue<TRaw, TIdentity>;

  private readonly memberSet: ReadonlySet<string>;

  public constructor(rawValues: readonly [TRaw, ...TRaw[]]) {
    if (rawValues.length === 0) {
      throw new EnumwaiiError("An enum must have at least one member");
    }

    const ownedRawValues = Object.freeze([
      ...new Set(rawValues),
    ]) as unknown as EnumwaiiValues<TRaw, TIdentity>;
    const memberSet = new Set<string>(ownedRawValues);

    this.rawValues = ownedRawValues;
    this.memberSet = memberSet;
    this.values = ownedRawValues as unknown as EnumwaiiValues<
      EnumwaiiValue<TRaw, TIdentity>,
      TIdentity
    >;
    const members = Object.freeze(
      Object.fromEntries(ownedRawValues.map((value) => [value, value])),
    );
    this.enum = members as {
      readonly [K in TRaw]: EnumwaiiValue<K, TIdentity>;
    };
    this.rawEnum = members as { readonly [K in TRaw]: K };
    this.cases = members as EnumwaiiCases<TRaw, TIdentity>;
    this["~standard"] = createStandardSchemaProps(this);
  }

  public is(input: unknown): input is EnumwaiiValue<TRaw, TIdentity> {
    return typeof input === "string" && this.memberSet.has(input);
  }

  public parse(
    input: unknown,
    options?: EnumwaiiParseOptions<EnumwaiiValue<TRaw, TIdentity>>,
  ): EnumwaiiValue<TRaw, TIdentity> {
    const result = this.safeParse(input, options);
    if (result.success) return result.value;
    throw result.error;
  }

  public safeParse(
    input: unknown,
    options?: EnumwaiiParseOptions<EnumwaiiValue<TRaw, TIdentity>>,
  ): EnumwaiiSafeParseResult<TRaw, TIdentity> {
    if (this.is(input)) return { success: true, value: input };
    if (
      (input === null || input === undefined) &&
      options?.default !== undefined
    ) {
      return { success: true, value: options.default };
    }
    if (options?.fallback !== undefined) {
      return { success: true, value: options.fallback };
    }
    return {
      success: false,
      error: new EnumwaiiParseError(input),
    };
  }

  public extend<TExtra extends string>(
    extraValues: readonly [TExtra, ...TExtra[]],
  ): Enumwaii<TRaw | TExtra, TIdentity> {
    return new Enumwaii([...this.rawValues, ...extraValues] as [
      TRaw | TExtra,
      ...(TRaw | TExtra)[],
    ]) as unknown as Enumwaii<TRaw | TExtra, TIdentity>;
  }

  public pick<
    const TPicked extends readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ],
  >(
    pickedValues: TPicked,
  ): Enumwaii<EnumwaiiRawValue<TPicked[number], TIdentity>, TIdentity> {
    for (const value of pickedValues) {
      if (!this.memberSet.has(value)) {
        throw new EnumwaiiError(`Cannot pick unknown member "${value}"`);
      }
    }
    return new Enumwaii(pickedValues as never) as unknown as Enumwaii<
      EnumwaiiRawValue<TPicked[number], TIdentity>,
      TIdentity
    >;
  }

  public omit<
    const TOmitted extends readonly [
      EnumwaiiValue<TRaw, TIdentity>,
      ...EnumwaiiValue<TRaw, TIdentity>[],
    ],
  >(
    omittedValues: TOmitted,
  ): Enumwaii<
    Exclude<TRaw, EnumwaiiRawValue<TOmitted[number], TIdentity>>,
    TIdentity
  > {
    const omittedSet = new Set<string>(omittedValues);
    for (const value of omittedValues) {
      if (!this.memberSet.has(value)) {
        throw new EnumwaiiError(`Cannot omit unknown member "${value}"`);
      }
    }

    const remaining = this.rawValues.filter((value) => !omittedSet.has(value));
    if (remaining.length === 0) {
      throw new EnumwaiiError("Cannot omit every member");
    }
    return new Enumwaii(remaining as never) as unknown as Enumwaii<
      Exclude<TRaw, EnumwaiiRawValue<TOmitted[number], TIdentity>>,
      TIdentity
    >;
  }

  public derive<TValue>(
    build: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue>;

  public derive<
    const TEntries extends readonly [
      EnumwaiiDeriveEntry<TRaw, TIdentity>,
      ...EnumwaiiDeriveEntry<TRaw, TIdentity>[],
    ],
  >(
    ...entries: TEntries &
      EnumwaiiValidateDeriveEntries<TRaw, TIdentity, TEntries>
  ): EnumwaiiDerived<TRaw, TIdentity, TEntries[number][1]>;

  public derive<TValue>(
    ...input: readonly unknown[]
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    const first = input[0];
    if (typeof first === "function") {
      const build = first as (value: EnumwaiiValue<TRaw, TIdentity>) => TValue;
      const mapping = Object.fromEntries(
        this.values.map((value) => [value, build(value)]),
      ) as Record<TRaw, TValue>;
      return this.buildDerived(mapping);
    }

    return this.buildDerived(
      this.createDerivedMapping(
        input as readonly EnumwaiiDeriveEntry<TRaw, TIdentity, TValue>[],
      ),
    );
  }

  public deriveTo<
    TTargetRaw extends string,
    TTargetIdentity extends string,
    const TEntries extends readonly [
      EnumwaiiDeriveToEntry<TRaw, TIdentity, TTargetRaw, TTargetIdentity>,
      ...EnumwaiiDeriveToEntry<TRaw, TIdentity, TTargetRaw, TTargetIdentity>[],
    ],
  >(
    target: Enumwaii<TTargetRaw, TTargetIdentity>,
    ...entries: TEntries &
      EnumwaiiValidateDeriveEntries<TRaw, TIdentity, TEntries>
  ): EnumwaiiDerived<TRaw, TIdentity, TEntries[number][1]> {
    const mapping = this.createDerivedMapping(entries);
    for (const value of Object.values(mapping)) {
      const targetValues = Array.isArray(value) ? value : [value];
      if (targetValues.some((targetValue) => !target.is(targetValue))) {
        throw new EnumwaiiError(
          "Derived mapping contains a value outside the target enum",
        );
      }
    }
    return this.buildDerived(mapping);
  }

  private createDerivedMapping<TValue>(
    entries: readonly EnumwaiiDeriveEntry<TRaw, TIdentity, TValue>[],
  ): Record<TRaw, TValue> {
    const seen = new Set<string>();
    for (const [key] of entries) {
      if (!this.memberSet.has(key)) {
        throw new EnumwaiiError(`Derived mapping has unknown key "${key}"`);
      }
      if (seen.has(key)) {
        throw new EnumwaiiError(`Derived mapping has duplicate key "${key}"`);
      }
      seen.add(key);
    }
    for (const value of this.rawValues) {
      if (!seen.has(value)) {
        throw new EnumwaiiError(`Derived mapping is missing "${value}"`);
      }
    }
    return Object.fromEntries(entries) as Record<TRaw, TValue>;
  }

  private buildDerived<TValue>(
    mapping: Record<TRaw, TValue>,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    function lookup(value: EnumwaiiValue<TRaw, TIdentity>): TValue {
      return mapping[value];
    }

    return Object.freeze({
      get: lookup,
      record: Object.freeze(mapping),
    });
  }
}
