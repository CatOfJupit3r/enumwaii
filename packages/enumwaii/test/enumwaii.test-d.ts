import { expectTypeOf } from "vitest";
import type { StandardSchemaV1 } from "@standard-schema/spec";

import {
  em,
  type EnumwaiiIdentity,
  type EnumwaiiValue,
  type InferEnumwaii,
  type InferEnumwaiiCase,
} from "../src/index";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
type Role = InferEnumwaii<typeof roles>;

expectTypeOf<Role>().toEqualTypeOf<
  EnumwaiiValue<"ADMIN" | "USER", EnumwaiiIdentity<"ADMIN" | "USER">>
>();
expectTypeOf<"ADMIN">().not.toExtend<Role>();
expectTypeOf(ROLE.ADMIN).toExtend<Role>();
expectTypeOf(RAW_ROLE.ADMIN).toEqualTypeOf<"ADMIN">();
expectTypeOf(RAW_ROLE.ADMIN).not.toExtend<Role>();
expectTypeOf<InferEnumwaiiCase<typeof roles>>().toEqualTypeOf<
  "ADMIN" | "USER"
>();
expectTypeOf(roles).toExtend<StandardSchemaV1<unknown, Role>>();
expectTypeOf<(typeof roles)["~type"]>().toEqualTypeOf<Role>();
expectTypeOf<(typeof roles)["~keys"]>().toEqualTypeOf<"ADMIN" | "USER">();
expectTypeOf<(typeof roles)["~safeParseResult"]>().toEqualTypeOf<
  ReturnType<typeof roles.safeParse>
>();

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

const derivedLabels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
);
expectTypeOf(derivedLabels.get(ROLE.ADMIN)).toEqualTypeOf<
  "Administrator" | "Member"
>();

interface RoleMetadata {
  readonly label: string;
  readonly rank: number;
}

const derivedMetadata = roles.derive<RoleMetadata>()(
  [ROLE.ADMIN, { label: "Administrator", rank: 2 }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
expectTypeOf(derivedMetadata.get(ROLE.ADMIN)).toEqualTypeOf<RoleMetadata>();
roles.derive<RoleMetadata>()(
  // @ts-expect-error contextually typed output must contain every required field
  [ROLE.ADMIN, { label: "Administrator" }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
roles.derive<RoleMetadata>()(
  // @ts-expect-error contextually typed output rejects unknown fields
  [ROLE.ADMIN, { label: "Administrator", rank: 2, hidden: true }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
// @ts-expect-error contextually typed mappings must contain every enum member
roles.derive<RoleMetadata>()([ROLE.ADMIN, { label: "Administrator", rank: 2 }]);
roles.derive<RoleMetadata>()(
  // @ts-expect-error contextually typed mappings require owned source members
  ["ADMIN", { label: "Administrator", rank: 2 }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
roles.derive<RoleMetadata>()(
  // @ts-expect-error contextually typed mappings reject duplicate members
  [ROLE.ADMIN, { label: "Administrator", rank: 2 }],
  [ROLE.ADMIN, { label: "Administrator again", rank: 2 }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
// @ts-expect-error derived mappings must contain every enum member
roles.derive([ROLE.ADMIN, "Administrator"]);
// @ts-expect-error derived mappings require owned source members
roles.derive(["ADMIN", "Administrator"], [ROLE.USER, "Member"]);

const other = em(["ADMIN"]);
const OTHER = other.enum;
// @ts-expect-error members from declarations with different sets are distinct
roles.derive([OTHER.ADMIN, "Administrator"], [ROLE.USER, "Member"]);
roles.derive<RoleMetadata>()(
  // @ts-expect-error contextually typed mappings reject foreign source members
  [OTHER.ADMIN, { label: "Administrator", rank: 2 }],
  [ROLE.USER, { label: "Member", rank: 1 }],
);
roles.derive(
  // @ts-expect-error derived mappings cannot contain duplicate members
  [ROLE.ADMIN, "First"],
  [ROLE.ADMIN, "Second"],
  [ROLE.USER, "Member"],
);

const lowerRoles = roles.derive((role) => role.toLowerCase());
expectTypeOf(lowerRoles.get(ROLE.ADMIN)).toEqualTypeOf<string>();

const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;
roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);
// @ts-expect-error targeted mappings must contain every source enum member
roles.deriveTo(permissions, [ROLE.ADMIN, PERMISSION.READ]);
roles.deriveTo(
  permissions,
  // @ts-expect-error targeted mappings require owned source members
  ["ADMIN", PERMISSION.READ],
  [ROLE.USER, PERMISSION.WRITE],
);
roles.deriveTo(
  permissions,
  // @ts-expect-error targeted mappings require owned target members
  [ROLE.ADMIN, "READ"],
  [ROLE.USER, PERMISSION.WRITE],
);
roles.deriveTo(
  permissions,
  // @ts-expect-error targeted mappings reject members from other target enums
  [ROLE.ADMIN, ROLE.ADMIN],
  [ROLE.USER, PERMISSION.WRITE],
);

expectTypeOf(OTHER.ADMIN).not.toExtend<Role>();

const anonymousA = em(["ON", "OFF"]);
const anonymousB = em(["ON", "OFF"]);
const ANONYMOUS_A = anonymousA.enum;
expectTypeOf(ANONYMOUS_A.ON).toExtend<InferEnumwaii<typeof anonymousB>>();

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
const wrongRole: Role = OTHER.ADMIN;
void wrongRole;
