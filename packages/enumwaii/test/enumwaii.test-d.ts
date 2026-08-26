import { expectTypeOf } from "vitest";

import {
  em,
  type EnumwaiiIdentity,
  type EnumwaiiValue,
  type InferEnumwaii,
  type InferEnumwaiiCase,
  type StandardSchemaV1,
} from "../src/index";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
type Role = InferEnumwaii<typeof roles>;

expectTypeOf<Role>().toEqualTypeOf<
  EnumwaiiValue<"ADMIN" | "USER", EnumwaiiIdentity<"ADMIN" | "USER">>
>();
expectTypeOf<"ADMIN">().not.toExtend<Role>();
expectTypeOf(ROLE.ADMIN).toExtend<Role>();
expectTypeOf(roles.rawEnum.ADMIN).toEqualTypeOf<"ADMIN">();
expectTypeOf(roles.rawEnum.ADMIN).not.toExtend<Role>();
expectTypeOf<InferEnumwaiiCase<typeof roles>>().toEqualTypeOf<
  "ADMIN" | "USER"
>();
expectTypeOf(roles).toExtend<StandardSchemaV1<unknown, Role>>();
expectTypeOf<(typeof roles)["~type"]>().toEqualTypeOf<Role>();
expectTypeOf<(typeof roles)["~keys"]>().toEqualTypeOf<"ADMIN" | "USER">();

const labels = {
  ADMIN: "Administrator",
  USER: "Member",
} as const satisfies Record<(typeof roles)["~keys"], string>;
const inlineLabels = {
  ADMIN: "Administrator",
  USER: "Member",
} as const satisfies Record<(typeof roles)["~keys"], string>;
void labels;
void inlineLabels;

const derivedLabels = roles.derive({
  ADMIN: "Administrator",
  USER: "Member",
});
expectTypeOf(derivedLabels.get(ROLE.ADMIN)).toEqualTypeOf<
  "Administrator" | "Member"
>();
// @ts-expect-error derived mappings must contain every enum member
roles.derive({ ADMIN: "Administrator" });
roles.derive({
  ADMIN: "Administrator",
  USER: "Member",
  // @ts-expect-error derived mappings cannot contain unknown members
  UNKNOWN: "Unknown",
});

const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;
roles.deriveTo(permissions, {
  ADMIN: [PERMISSION.READ, PERMISSION.WRITE],
  USER: PERMISSION.READ,
});
// @ts-expect-error targeted mappings must contain every source enum member
roles.deriveTo(permissions, { ADMIN: PERMISSION.READ });
roles.deriveTo(permissions, {
  ADMIN: PERMISSION.READ,
  USER: PERMISSION.WRITE,
  // @ts-expect-error targeted mappings cannot contain unknown source members
  UNKNOWN: PERMISSION.READ,
});

const other = em(["ADMIN"]);
expectTypeOf(other.enum.ADMIN).not.toExtend<Role>();

const anonymousA = em(["ON", "OFF"]);
const anonymousB = em(["ON", "OFF"]);
expectTypeOf(anonymousA.enum.ON).toExtend<InferEnumwaii<typeof anonymousB>>();

const parsed = roles.safeParse("ADMIN");
if (parsed.success) expectTypeOf(parsed.value).toEqualTypeOf<Role>();

roles.parse(undefined, { default: ROLE.USER });
roles.parse("OWNER", { fallback: ROLE.ADMIN });
// @ts-expect-error defaults must be owned members
roles.parse(undefined, { default: "USER" });

const picked = roles.pick([ROLE.ADMIN]);
expectTypeOf<InferEnumwaii<typeof picked>>().toEqualTypeOf<
  EnumwaiiValue<"ADMIN", EnumwaiiIdentity<"ADMIN" | "USER">>
>();

// @ts-expect-error raw values must enter through parse or an owned member
const rawRole: Role = "ADMIN";
void rawRole;

// @ts-expect-error members from declarations with different sets are distinct
const wrongRole: Role = other.enum.ADMIN;
void wrongRole;
