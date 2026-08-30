import type {
  AccessInvitation,
  AccessLevel,
  Permission,
} from "./domain/access-control";
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_VALUES,
  PERMISSIONS,
  acceptAccessLevel,
  canAccess,
} from "./domain/access-control";
import AccessLevelCard from "./components/AccessLevelCard.vue";

declare const rawString: string;
declare const brandedLevel: AccessLevel;
declare const brandedPermission: Permission;

acceptAccessLevel(brandedLevel);
canAccess(brandedLevel, brandedPermission);
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
void PERMISSIONS;
void validCardProps;
void validInvitation;

// @ts-expect-error Raw strings cannot enter a branded domain API.
acceptAccessLevel(rawString);
// @ts-expect-error Raw strings cannot enter a branded domain API.
canAccess(rawString, brandedPermission);
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
