import { em, type InferEnumwaii } from "enumwaii";

const accessLevelEnum = em(["OWNER", "EDITOR", "VIEWER", "GUEST"]);

// This is the only enum view extracted in this module. Everything else uses
// the branded members from this stable, named boundary.
export const ACCESS_LEVELS = accessLevelEnum.enum;
export const ACCESS_LEVEL_VALUES = accessLevelEnum.values;
export type AccessLevel = InferEnumwaii<typeof accessLevelEnum>;
export type AccessLevelParseResult =
  (typeof accessLevelEnum)["~safeParseResult"];

export interface AccessInvitation {
  readonly email: string;
  readonly level: AccessLevel;
  readonly note: string;
}

export interface AccessLevelMetadata {
  readonly label: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly accent: "violet" | "blue" | "cyan" | "amber";
  readonly rank: number;
}

const accessLevelMetadata = accessLevelEnum.derive(
  [
    ACCESS_LEVELS.OWNER,
    {
      label: "Owner",
      eyebrow: "Full control",
      description: "Can shape the workspace, manage people, and see billing.",
      accent: "violet",
      rank: 4,
    },
  ],
  [
    ACCESS_LEVELS.EDITOR,
    {
      label: "Editor",
      eyebrow: "Build and share",
      description: "Can create, update, and invite teammates to collaborate.",
      accent: "blue",
      rank: 3,
    },
  ],
  [
    ACCESS_LEVELS.VIEWER,
    {
      label: "Viewer",
      eyebrow: "Read only",
      description: "Can inspect workspace content without changing anything.",
      accent: "cyan",
      rank: 2,
    },
  ],
  [
    ACCESS_LEVELS.GUEST,
    {
      label: "Guest",
      eyebrow: "Limited view",
      description: "Can see explicitly shared items and nothing more.",
      accent: "amber",
      rank: 1,
    },
  ],
);

const permissionEnum = em(["READ", "WRITE", "INVITE", "BILLING"]);
export const PERMISSIONS = permissionEnum.enum;
export const PERMISSION_VALUES = permissionEnum.values;
export type Permission = InferEnumwaii<typeof permissionEnum>;

export interface PermissionMetadata {
  readonly label: string;
  readonly description: string;
}

const permissionMetadata = permissionEnum.derive(
  [
    PERMISSIONS.READ,
    {
      label: "Read workspace",
      description: "Open content and activity",
    },
  ],
  [
    PERMISSIONS.WRITE,
    {
      label: "Edit content",
      description: "Create and update workspace items",
    },
  ],
  [
    PERMISSIONS.INVITE,
    {
      label: "Invite teammates",
      description: "Add people to the workspace",
    },
  ],
  [
    PERMISSIONS.BILLING,
    {
      label: "Manage billing",
      description: "View invoices and change the plan",
    },
  ],
);

// Permission policy is exhaustive: adding an access level or permission makes
// TypeScript ask for a corresponding mapping entry at this declaration.
const permissionsByAccessLevel = accessLevelEnum.deriveTo(
  permissionEnum,
  [
    ACCESS_LEVELS.OWNER,
    [
      PERMISSIONS.READ,
      PERMISSIONS.WRITE,
      PERMISSIONS.INVITE,
      PERMISSIONS.BILLING,
    ],
  ],
  [
    ACCESS_LEVELS.EDITOR,
    [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.INVITE],
  ],
  [ACCESS_LEVELS.VIEWER, [PERMISSIONS.READ]],
  [ACCESS_LEVELS.GUEST, [PERMISSIONS.READ]],
);

const accessPolicies = em(["STRICT", "NIL_DEFAULT", "FALLBACK"]);
export const ACCESS_POLICY = accessPolicies.enum;
export const ACCESS_POLICY_VALUES = accessPolicies.values;
export const accessPolicySchema = accessPolicies;
export type AccessPolicy = InferEnumwaii<typeof accessPolicies>;

interface AccessPolicyDefinition {
  readonly label: string;
  readonly description: string;
  parse(input: unknown): AccessLevelParseResult;
}

const accessPolicyDefinitions = accessPolicies.derive<AccessPolicyDefinition>()(
  [
    ACCESS_POLICY.STRICT,
    {
      label: "Strict rejection",
      description: "Unknown values never enter state.",
      parse(input: unknown): AccessLevelParseResult {
        return accessLevelEnum.safeParse(input);
      },
    },
  ],
  [
    ACCESS_POLICY.NIL_DEFAULT,
    {
      label: "Nil-only default",
      description:
        "Only null and undefined become Viewer; malformed values reject.",
      parse(input: unknown): AccessLevelParseResult {
        return accessLevelEnum.safeParse(input, {
          default: ACCESS_LEVELS.VIEWER,
        });
      },
    },
  ],
  [
    ACCESS_POLICY.FALLBACK,
    {
      label: "Invalid-input fallback",
      description: "Any malformed value becomes the explicit Guest fallback.",
      parse(input: unknown): AccessLevelParseResult {
        return accessLevelEnum.safeParse(input, {
          fallback: ACCESS_LEVELS.GUEST,
        });
      },
    },
  ],
);

function isPermissionList(
  input: Permission | readonly Permission[],
): input is readonly Permission[] {
  return Array.isArray(input);
}

export function describeAccessLevel(level: AccessLevel): AccessLevelMetadata {
  return accessLevelMetadata.get(level);
}

export function describePermission(permission: Permission): PermissionMetadata {
  return permissionMetadata.get(permission);
}

export function permissionsFor(level: AccessLevel): readonly Permission[] {
  const permissions = permissionsByAccessLevel.get(level);
  return isPermissionList(permissions) ? permissions : [permissions];
}

export function canAccess(level: AccessLevel, permission: Permission): boolean {
  return permissionsFor(level).some((candidate) => candidate === permission);
}

export function parseAccessLevel(
  input: unknown,
  policy: AccessPolicy,
): AccessLevelParseResult {
  return accessPolicyDefinitions.get(policy).parse(input);
}

export function policyLabel(policy: AccessPolicy): string {
  return accessPolicyDefinitions.get(policy).label;
}

export function policyDescription(policy: AccessPolicy): string {
  return accessPolicyDefinitions.get(policy).description;
}

export function acceptAccessLevel(level: AccessLevel): AccessLevel {
  return level;
}
