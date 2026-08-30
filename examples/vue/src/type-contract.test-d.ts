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
  PERMISSIONS,
  accessPolicySchema,
  acceptAccessLevel,
  canAccess,
  parseAccessLevel,
} from "./domain/access-control";
import AccessLevelCard from "./components/AccessLevelCard.vue";

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
const validCardProps = {
  level: ACCESS_LEVELS.EDITOR,
  metadata: {
    label: "Editor",
    eyebrow: "Build and share",
    description: "Can create, update, and invite teammates to collaborate.",
    accent: "blue",
    rank: 3,
  },
  permissions: [],
  selected: false,
} satisfies InstanceType<typeof AccessLevelCard>["$props"];
const validInvitation = {
  email: "alex@studio.dev",
  level: ACCESS_LEVELS.EDITOR,
  note: "Launch review",
} satisfies AccessInvitation;
void ACCESS_LEVEL_VALUES;
void ACCESS_POLICY_VALUES;
void PERMISSIONS;
void validCardProps;
void validInvitation;

// @ts-expect-error Raw strings cannot enter a branded domain API.
acceptAccessLevel(rawString);
// @ts-expect-error Raw strings cannot enter a branded domain API.
canAccess(rawString, brandedPermission);
// @ts-expect-error Raw strings cannot select enumwaii-owned behavior.
parseAccessLevel(rawString, "STRICT");
// @ts-expect-error Same-spelling members from another declaration keep their provenance.
parseAccessLevel(rawString, FOREIGN_POLICY.STRICT);
const invalidCardProps = {
  ...validCardProps,
  // @ts-expect-error Component props carry the branded AccessLevel contract.
  level: rawString,
} satisfies InstanceType<typeof AccessLevelCard>["$props"];
const invalidInvitation = {
  email: "alex@studio.dev",
  // @ts-expect-error Native form strings must be parsed before domain events.
  level: rawString,
  note: "Launch review",
} satisfies AccessInvitation;
void invalidCardProps;
void invalidInvitation;
