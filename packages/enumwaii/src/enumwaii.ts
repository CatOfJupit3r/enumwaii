import type { StandardSchemaV1 } from "@standard-schema/spec";

import { EnumwaiiError } from "./errors/enumwaii-error";
import { EnumwaiiParseError } from "./errors/enumwaii-parse-error";
import { EnumwaiiUnknownMemberError } from "./errors/enumwaii-unknown-member-error";
import { createStandardSchemaProps } from "./internal/create-standard-schema";
import { guardMemberAccess } from "./internal/guard-member-access";
import type {
  EnumwaiiCases,
  EnumwaiiDerived,
  EnumwaiiIdentity,
  EnumwaiiParseOptions,
  EnumwaiiRawValue,
  EnumwaiiSafeParseResult,
  EnumwaiiValue,
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
    const members = guardMemberAccess(
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

  public derive<const TValue>(
    mapping: Readonly<Record<TRaw, TValue>>,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    const keys = new Set(Object.keys(mapping));
    for (const value of this.rawValues) {
      if (!keys.has(value)) {
        throw new EnumwaiiError(`Derived mapping is missing "${value}"`);
      }
    }
    for (const key of keys) {
      if (!this.memberSet.has(key)) {
        throw new EnumwaiiError(`Derived mapping has unknown key "${key}"`);
      }
    }
    return this.buildDerived(mapping as Record<TRaw, TValue>);
  }

  public deriveWith<TValue>(
    build: (value: EnumwaiiValue<TRaw, TIdentity>) => TValue,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    const mapping = Object.fromEntries(
      this.values.map((value) => [value, build(value)]),
    ) as Record<TRaw, TValue>;
    return this.buildDerived(mapping);
  }

  public deriveTo<
    TTargetRaw extends string,
    TTargetIdentity extends string,
    const TMapping extends Readonly<
      Record<
        TRaw,
        | EnumwaiiValue<TTargetRaw, TTargetIdentity>
        | readonly EnumwaiiValue<TTargetRaw, TTargetIdentity>[]
      >
    >,
  >(
    target: Enumwaii<TTargetRaw, TTargetIdentity>,
    mapping: TMapping & Readonly<Record<Exclude<keyof TMapping, TRaw>, never>>,
  ): EnumwaiiDerived<TRaw, TIdentity, TMapping[TRaw]> {
    const keys = new Set(Object.keys(mapping));
    for (const value of this.rawValues) {
      if (!keys.has(value)) {
        throw new EnumwaiiError(`Derived mapping is missing "${value}"`);
      }
    }
    for (const key of keys) {
      if (!this.memberSet.has(key)) {
        throw new EnumwaiiError(`Derived mapping has unknown key "${key}"`);
      }
    }
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

  private buildDerived<TValue>(
    mapping: Record<TRaw, TValue>,
  ): EnumwaiiDerived<TRaw, TIdentity, TValue> {
    const { memberSet } = this;

    function lookup(value: EnumwaiiValue<TRaw, TIdentity>): TValue {
      if (!memberSet.has(value)) {
        throw new EnumwaiiUnknownMemberError(value);
      }
      return mapping[value];
    }

    return Object.freeze({
      get: lookup,
      record: guardMemberAccess(Object.freeze({ ...mapping })),
    });
  }
}
