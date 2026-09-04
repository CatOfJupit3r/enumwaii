import { em } from "enumwaii";
import type {
  AccessInvitation,
  AccessLevel,
  AccessPolicy,
  Permission,
} from "./domain/access-control";
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_VALUES,
  ACCESS_POLICY,
  ACCESS_POLICY_VALUES,
  INVITABLE_ACCESS_LEVELS,
  INVITABLE_ACCESS_LEVEL_VALUES,
  PERMISSIONS,
  accessPolicySchema,
  acceptAccessLevel,
  canAccess,
  parseAccessLevel,
} from "./domain/access-control";
import MemberRoleSelect from "./components/MemberRoleSelect.vue";

declare const rawString: string;
declare const brandedLevel: AccessLevel;
declare const brandedPermission: Permission;
declare const brandedPolicy: AccessPolicy;

const foreignPolicies = em(["STRICT", "AUDIT"]);
const FOREIGN_POLICY = foreignPolicies.enum;

acceptAccessLevel(brandedLevel);
canAccess(brandedLevel, brandedPermission);
parseAccessLevel(rawString, brandedPolicy);
parseAccessLevel(rawString, ACCESS_POLICY.STRICT);
accessPolicySchema.parse(rawString);
const validRoleSelectProps = {
  memberId: "maya",
  level: ACCESS_LEVELS.EDITOR,
} satisfies InstanceType<typeof MemberRoleSelect>["$props"];
const validInvitation = {
  email: "alex@studio.dev",
  level: ACCESS_LEVELS.EDITOR,
  note: "Launch review",
} satisfies AccessInvitation;
void ACCESS_LEVEL_VALUES;
void ACCESS_POLICY_VALUES;
void INVITABLE_ACCESS_LEVEL_VALUES;
void PERMISSIONS;
void validRoleSelectProps;
void validInvitation;

// @ts-expect-error Raw strings cannot enter a branded domain API.
acceptAccessLevel(rawString);
// @ts-expect-error Raw strings cannot enter a branded domain API.
canAccess(rawString, brandedPermission);
// @ts-expect-error Raw strings cannot select enumwaii-owned behavior.
parseAccessLevel(rawString, "STRICT");
// @ts-expect-error Same-spelling members from another declaration keep their provenance.
parseAccessLevel(rawString, FOREIGN_POLICY.STRICT);
const invalidRoleSelectProps = {
  ...validRoleSelectProps,
  // @ts-expect-error Component props carry the branded AccessLevel contract.
  level: rawString,
} satisfies InstanceType<typeof MemberRoleSelect>["$props"];
const invalidInvitation = {
  email: "alex@studio.dev",
  // @ts-expect-error Native form strings must be parsed before domain events.
  level: rawString,
  note: "Launch review",
} satisfies AccessInvitation;
void invalidRoleSelectProps;
void invalidInvitation;

// @ts-expect-error Owner is absent from the invitation-safe omit() subset.
void INVITABLE_ACCESS_LEVELS.OWNER;

const ownerInvitation: AccessInvitation = {
  email: "owner@studio.dev",
  // @ts-expect-error Owner is not an invitable role, even though it is an owned AccessLevel.
  level: ACCESS_LEVELS.OWNER,
  note: "",
};
void ownerInvitation;
