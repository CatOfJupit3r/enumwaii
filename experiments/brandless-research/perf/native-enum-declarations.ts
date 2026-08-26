declare function consume<T>(value: T): void;

type StringValues<TEnum extends object> = Extract<TEnum[keyof TEnum], string>;

declare function makeNativeEnum<const TEnum extends object>(
  enumObject: TEnum,
): {
  readonly enum: TEnum;
  readonly "~type": StringValues<TEnum>;
};

enum Carrier01 {
  A01 = "A01",
  B01 = "B01",
  C01 = "C01",
  D01 = "D01",
}
const enum01 = makeNativeEnum(Carrier01);
type Value01 = (typeof enum01)["~type"];
consume<Value01>(enum01.enum.A01);
consume([enum01.enum.A01, enum01.enum.B01] as const);
consume({
  [enum01.enum.A01]: 1,
  [enum01.enum.B01]: 2,
  [enum01.enum.C01]: 3,
  [enum01.enum.D01]: 4,
} satisfies Record<Value01, number>);

enum Carrier02 {
  A02 = "A02",
  B02 = "B02",
  C02 = "C02",
  D02 = "D02",
}
const enum02 = makeNativeEnum(Carrier02);
type Value02 = (typeof enum02)["~type"];
consume<Value02>(enum02.enum.A02);
consume([enum02.enum.A02, enum02.enum.B02] as const);
consume({
  [enum02.enum.A02]: 1,
  [enum02.enum.B02]: 2,
  [enum02.enum.C02]: 3,
  [enum02.enum.D02]: 4,
} satisfies Record<Value02, number>);

enum Carrier03 {
  A03 = "A03",
  B03 = "B03",
  C03 = "C03",
  D03 = "D03",
}
const enum03 = makeNativeEnum(Carrier03);
type Value03 = (typeof enum03)["~type"];
consume<Value03>(enum03.enum.A03);
consume([enum03.enum.A03, enum03.enum.B03] as const);
consume({
  [enum03.enum.A03]: 1,
  [enum03.enum.B03]: 2,
  [enum03.enum.C03]: 3,
  [enum03.enum.D03]: 4,
} satisfies Record<Value03, number>);

enum Carrier04 {
  A04 = "A04",
  B04 = "B04",
  C04 = "C04",
  D04 = "D04",
}
const enum04 = makeNativeEnum(Carrier04);
type Value04 = (typeof enum04)["~type"];
consume<Value04>(enum04.enum.A04);
consume([enum04.enum.A04, enum04.enum.B04] as const);
consume({
  [enum04.enum.A04]: 1,
  [enum04.enum.B04]: 2,
  [enum04.enum.C04]: 3,
  [enum04.enum.D04]: 4,
} satisfies Record<Value04, number>);

enum Carrier05 {
  A05 = "A05",
  B05 = "B05",
  C05 = "C05",
  D05 = "D05",
}
const enum05 = makeNativeEnum(Carrier05);
type Value05 = (typeof enum05)["~type"];
consume<Value05>(enum05.enum.A05);
consume([enum05.enum.A05, enum05.enum.B05] as const);
consume({
  [enum05.enum.A05]: 1,
  [enum05.enum.B05]: 2,
  [enum05.enum.C05]: 3,
  [enum05.enum.D05]: 4,
} satisfies Record<Value05, number>);

enum Carrier06 {
  A06 = "A06",
  B06 = "B06",
  C06 = "C06",
  D06 = "D06",
}
const enum06 = makeNativeEnum(Carrier06);
type Value06 = (typeof enum06)["~type"];
consume<Value06>(enum06.enum.A06);
consume([enum06.enum.A06, enum06.enum.B06] as const);
consume({
  [enum06.enum.A06]: 1,
  [enum06.enum.B06]: 2,
  [enum06.enum.C06]: 3,
  [enum06.enum.D06]: 4,
} satisfies Record<Value06, number>);

enum Carrier07 {
  A07 = "A07",
  B07 = "B07",
  C07 = "C07",
  D07 = "D07",
}
const enum07 = makeNativeEnum(Carrier07);
type Value07 = (typeof enum07)["~type"];
consume<Value07>(enum07.enum.A07);
consume([enum07.enum.A07, enum07.enum.B07] as const);
consume({
  [enum07.enum.A07]: 1,
  [enum07.enum.B07]: 2,
  [enum07.enum.C07]: 3,
  [enum07.enum.D07]: 4,
} satisfies Record<Value07, number>);

enum Carrier08 {
  A08 = "A08",
  B08 = "B08",
  C08 = "C08",
  D08 = "D08",
}
const enum08 = makeNativeEnum(Carrier08);
type Value08 = (typeof enum08)["~type"];
consume<Value08>(enum08.enum.A08);
consume([enum08.enum.A08, enum08.enum.B08] as const);
consume({
  [enum08.enum.A08]: 1,
  [enum08.enum.B08]: 2,
  [enum08.enum.C08]: 3,
  [enum08.enum.D08]: 4,
} satisfies Record<Value08, number>);

enum Carrier09 {
  A09 = "A09",
  B09 = "B09",
  C09 = "C09",
  D09 = "D09",
}
const enum09 = makeNativeEnum(Carrier09);
type Value09 = (typeof enum09)["~type"];
consume<Value09>(enum09.enum.A09);
consume([enum09.enum.A09, enum09.enum.B09] as const);
consume({
  [enum09.enum.A09]: 1,
  [enum09.enum.B09]: 2,
  [enum09.enum.C09]: 3,
  [enum09.enum.D09]: 4,
} satisfies Record<Value09, number>);

enum Carrier10 {
  A10 = "A10",
  B10 = "B10",
  C10 = "C10",
  D10 = "D10",
}
const enum10 = makeNativeEnum(Carrier10);
type Value10 = (typeof enum10)["~type"];
consume<Value10>(enum10.enum.A10);
consume([enum10.enum.A10, enum10.enum.B10] as const);
consume({
  [enum10.enum.A10]: 1,
  [enum10.enum.B10]: 2,
  [enum10.enum.C10]: 3,
  [enum10.enum.D10]: 4,
} satisfies Record<Value10, number>);

enum Carrier11 {
  A11 = "A11",
  B11 = "B11",
  C11 = "C11",
  D11 = "D11",
}
const enum11 = makeNativeEnum(Carrier11);
type Value11 = (typeof enum11)["~type"];
consume<Value11>(enum11.enum.A11);
consume([enum11.enum.A11, enum11.enum.B11] as const);
consume({
  [enum11.enum.A11]: 1,
  [enum11.enum.B11]: 2,
  [enum11.enum.C11]: 3,
  [enum11.enum.D11]: 4,
} satisfies Record<Value11, number>);

enum Carrier12 {
  A12 = "A12",
  B12 = "B12",
  C12 = "C12",
  D12 = "D12",
}
const enum12 = makeNativeEnum(Carrier12);
type Value12 = (typeof enum12)["~type"];
consume<Value12>(enum12.enum.A12);
consume([enum12.enum.A12, enum12.enum.B12] as const);
consume({
  [enum12.enum.A12]: 1,
  [enum12.enum.B12]: 2,
  [enum12.enum.C12]: 3,
  [enum12.enum.D12]: 4,
} satisfies Record<Value12, number>);
