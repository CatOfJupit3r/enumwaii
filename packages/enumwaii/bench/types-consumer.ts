import { em, type InferEnumwaii } from "../src/index";
import { valibotSchema } from "../src/adapters/valibot";
import { zodSchema } from "../src/adapters/zod";

const enum01 = em(["A01", "B01", "C01", "D01"]);
const enum02 = em(["A02", "B02", "C02", "D02"]);
const enum03 = em(["A03", "B03", "C03", "D03"]);
const enum04 = em(["A04", "B04", "C04", "D04"]);
const enum05 = em(["A05", "B05", "C05", "D05"]);
const enum06 = em(["A06", "B06", "C06", "D06"]);
const enum07 = em(["A07", "B07", "C07", "D07"]);
const enum08 = em(["A08", "B08", "C08", "D08"]);
const enum09 = em(["A09", "B09", "C09", "D09"]);
const enum10 = em(["A10", "B10", "C10", "D10"]);
const enum11 = em(["A11", "B11", "C11", "D11"]);
const enum12 = em(["A12", "B12", "C12", "D12"]);

const ENUM01 = enum01.enum;
const ENUM02 = enum02.enum;
const ENUM03 = enum03.enum;
const ENUM04 = enum04.enum;
const ENUM05 = enum05.enum;
const ENUM06 = enum06.enum;

const combined01 = em.combine([enum01, enum02, enum03]);
const combined02 = em.combine([enum04, enum05, enum06]);
const combined03 = em.combine([enum07, enum08, enum09]);
const combined04 = em.combine([enum10, enum11, enum12]);

const COMBINED01 = combined01.enum;
const COMBINED02 = combined02.enum;
const COMBINED03 = combined03.enum;
const COMBINED04 = combined04.enum;

const picked01 = enum01.pick([ENUM01.A01, ENUM01.B01]);
const picked02 = enum02.pick([ENUM02.A02, ENUM02.B02]);
const picked03 = enum03.pick([ENUM03.A03, ENUM03.B03]);
const picked04 = enum04.pick([ENUM04.A04, ENUM04.B04]);
const picked05 = enum05.pick([ENUM05.A05, ENUM05.B05]);
const picked06 = enum06.pick([ENUM06.A06, ENUM06.B06]);

const derived01 = enum01.derive((value) => value.toLowerCase());
const derived02 = enum02.derive((value) => value.toLowerCase());
const derived03 = enum03.derive((value) => value.toLowerCase());
const derived04 = enum04.derive((value) => value.toLowerCase());
const derived05 = enum05.derive((value) => value.toLowerCase());
const derived06 = enum06.derive((value) => value.toLowerCase());

const zod01 = zodSchema(enum01);
const zod02 = zodSchema(enum02);
const zod03 = zodSchema(enum03);
const zod04 = zodSchema(enum04);
const valibot01 = valibotSchema(enum05);
const valibot02 = valibotSchema(enum06);
const valibot03 = valibotSchema(enum07);
const valibot04 = valibotSchema(enum08);

type Value01 = InferEnumwaii<typeof enum01>;
type Value02 = InferEnumwaii<typeof enum02>;
type Value03 = InferEnumwaii<typeof enum03>;
type Value04 = InferEnumwaii<typeof enum04>;
type Combined01 = InferEnumwaii<typeof combined01>;
type Combined02 = InferEnumwaii<typeof combined02>;
type Combined03 = InferEnumwaii<typeof combined03>;
type Combined04 = InferEnumwaii<typeof combined04>;

declare function consume<T>(value: T): void;
consume<Value01>(ENUM01.A01);
consume<Value02>(ENUM02.A02);
consume<Value03>(ENUM03.A03);
consume<Value04>(ENUM04.A04);
consume<Combined01>(COMBINED01.A01);
consume<Combined02>(COMBINED02.A04);
consume<Combined03>(COMBINED03.A07);
consume<Combined04>(COMBINED04.A10);
consume(picked01);
consume(picked02);
consume(picked03);
consume(picked04);
consume(picked05);
consume(picked06);
consume(derived01);
consume(derived02);
consume(derived03);
consume(derived04);
consume(derived05);
consume(derived06);
consume(zod01);
consume(zod02);
consume(zod03);
consume(zod04);
consume(valibot01);
consume(valibot02);
consume(valibot03);
consume(valibot04);
