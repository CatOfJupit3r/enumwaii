declare const valueBrand: unique symbol;

type Identity<TRaw extends string> = `enumwaii:${TRaw}`;
type BrandedValue<TRaw extends string, TIdentity extends string> =
  TRaw extends string
    ? TRaw & {
        readonly [valueBrand]: {
          readonly identity: TIdentity;
          readonly raw: TRaw;
          readonly invariant: (identity: TIdentity) => TIdentity;
        };
      }
    : never;

declare function makeBranded<
  const TValues extends readonly [string, ...string[]],
>(values: TValues): {
  readonly enum: {
    readonly [K in TValues[number]]: BrandedValue<
      K,
      Identity<TValues[number]>
    >;
  };
  readonly "~type": BrandedValue<
    TValues[number],
    Identity<TValues[number]>
  >;
};

declare function consume<T>(value: T): void;

const enum01 = makeBranded(["A01", "B01", "C01", "D01"]);
type Value01 = typeof enum01["~type"];
consume<Value01>(enum01.enum.A01);
consume([enum01.enum.A01, enum01.enum.B01] as const);

const enum02 = makeBranded(["A02", "B02", "C02", "D02"]);
type Value02 = typeof enum02["~type"];
consume<Value02>(enum02.enum.A02);
consume([enum02.enum.A02, enum02.enum.B02] as const);

const enum03 = makeBranded(["A03", "B03", "C03", "D03"]);
type Value03 = typeof enum03["~type"];
consume<Value03>(enum03.enum.A03);
consume([enum03.enum.A03, enum03.enum.B03] as const);

const enum04 = makeBranded(["A04", "B04", "C04", "D04"]);
type Value04 = typeof enum04["~type"];
consume<Value04>(enum04.enum.A04);
consume([enum04.enum.A04, enum04.enum.B04] as const);

const enum05 = makeBranded(["A05", "B05", "C05", "D05"]);
type Value05 = typeof enum05["~type"];
consume<Value05>(enum05.enum.A05);
consume([enum05.enum.A05, enum05.enum.B05] as const);

const enum06 = makeBranded(["A06", "B06", "C06", "D06"]);
type Value06 = typeof enum06["~type"];
consume<Value06>(enum06.enum.A06);
consume([enum06.enum.A06, enum06.enum.B06] as const);

const enum07 = makeBranded(["A07", "B07", "C07", "D07"]);
type Value07 = typeof enum07["~type"];
consume<Value07>(enum07.enum.A07);
consume([enum07.enum.A07, enum07.enum.B07] as const);

const enum08 = makeBranded(["A08", "B08", "C08", "D08"]);
type Value08 = typeof enum08["~type"];
consume<Value08>(enum08.enum.A08);
consume([enum08.enum.A08, enum08.enum.B08] as const);

const enum09 = makeBranded(["A09", "B09", "C09", "D09"]);
type Value09 = typeof enum09["~type"];
consume<Value09>(enum09.enum.A09);
consume([enum09.enum.A09, enum09.enum.B09] as const);

const enum10 = makeBranded(["A10", "B10", "C10", "D10"]);
type Value10 = typeof enum10["~type"];
consume<Value10>(enum10.enum.A10);
consume([enum10.enum.A10, enum10.enum.B10] as const);

const enum11 = makeBranded(["A11", "B11", "C11", "D11"]);
type Value11 = typeof enum11["~type"];
consume<Value11>(enum11.enum.A11);
consume([enum11.enum.A11, enum11.enum.B11] as const);

const enum12 = makeBranded(["A12", "B12", "C12", "D12"]);
type Value12 = typeof enum12["~type"];
consume<Value12>(enum12.enum.A12);
consume([enum12.enum.A12, enum12.enum.B12] as const);

