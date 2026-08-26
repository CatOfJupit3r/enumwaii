import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import {
  analyzeOwnership,
  collectDiagnostics,
  createVirtualProject,
  expectedIssueLocations,
  measureProgram,
  nativeApiDeclaration,
  shadowApiDeclaration,
} from "./brandless-investigation/harness";
import type {
  OwnershipIssueKind,
  ProgramMetrics,
  VirtualProject,
} from "./brandless-investigation/harness";

const ownershipFiles = {
  "api.d.ts": shadowApiDeclaration,
  "roles.ts": `
import { em } from "./api";

export const roles = em(["ADMIN", "USER", "GUEST"]);
export const ROLE = roles.enum;
export type Role = typeof roles["~type"];
export const sameRoles = em(["GUEST", "ADMIN", "USER"]);
export const actors = em(["ADMIN", "BOT"]);
export const ACTOR = actors.enum;
`,
  "reexport.ts": `
export { ACTOR, ROLE, actors, roles, sameRoles } from "./roles";
export type { Role } from "./roles";
`,
  "external.d.ts": `
import type { Role } from "./roles";
export declare function externalIdentity<T>(value: T): T;
export declare function externalRole(): Role;
`,
  "helpers.ts": `
import { ROLE } from "./roles";
import type { Role } from "./roles";

export function identity<T>(value: T): T { return value; }
export function constrained<T extends Role>(value: T): T { return value; }
export function returnOwned(): Role { return ROLE.ADMIN; }
export function returnRaw(): Role { return "ADMIN"; } // @owned-error raw-return
export function launder(_role: Role): "ADMIN" { return "ADMIN"; }
export function genericLiar<T>(_value: T): T { return "ADMIN" as T; } // @owned-error generic-assertion
export function* roleGenerator() { yield ROLE.ADMIN; yield ROLE.USER; }
export async function asyncRole(): Promise<Role> { return ROLE.ADMIN; }
export function overloaded(value: Role): Role;
export function overloaded(value: string): string;
export function overloaded(value: string): string { return value; }
`,
  "consumer.ts": `
import { ACTOR, ROLE, actors, roles, sameRoles } from "./reexport";
import type { Role } from "./reexport";
import { externalIdentity, externalRole as readExternalRole } from "./external";
import { asyncRole, constrained, identity, launder, overloaded, returnOwned, roleGenerator } from "./helpers";

declare const input: unknown;
declare const condition: boolean;
declare const externalRole: Role;
declare function acceptRole(role: Role): void;

acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // @owned-error direct-raw
acceptRole(ACTOR.ADMIN); // @owned-error direct-foreign
const raw = "ADMIN" as const;
acceptRole(raw); // @owned-error raw-alias
const owned = ROLE.ADMIN;
acceptRole(owned);
const foreign = ACTOR.ADMIN;
acceptRole(foreign); // @owned-error foreign-alias
const parsed = roles.parse(input);
acceptRole(parsed);
const asserted = "ADMIN" as Role; // @owned-error assertion
acceptRole(asserted);
acceptRole(identity(ROLE.ADMIN));
acceptRole(identity("ADMIN" as const)); // @owned-error generic-raw
acceptRole(externalIdentity(ROLE.ADMIN));
[ROLE.ADMIN].map((role) => acceptRole(role));
new Set([ROLE.ADMIN]).forEach(acceptRole);
Promise.resolve(ROLE.ADMIN).then(acceptRole);
acceptRole(returnOwned());
acceptRole(launder(ROLE.ADMIN)); // @owned-error laundering
const holder: { role: Role } = { role: ROLE.ADMIN };
const badHolder: { role: Role } = { role: "ADMIN" }; // @owned-error object-raw
const foreignHolder: { role: Role } = { role: ACTOR.ADMIN }; // @owned-error object-foreign
const { role } = holder;
acceptRole(role);
acceptRole(externalRole);
acceptRole(readExternalRole());
acceptRole(sameRoles.enum.ADMIN);
const conditional = condition ? ROLE.ADMIN : ROLE.USER;
acceptRole(conditional);
const mixedConditional = condition ? ROLE.ADMIN : "ADMIN";
acceptRole(mixedConditional); // @owned-error conditional-raw
const copiedHolder = { ...holder };
acceptRole(copiedHolder.role);
const copiedValues = [...roles.values];
copiedValues.forEach(acceptRole);
const [firstRole] = copiedValues;
if (firstRole !== undefined) acceptRole(firstRole);
const ownedSet = new Set([ROLE.ADMIN]);
for (const setRole of ownedSet) acceptRole(setRole);
const ownedMap = new Map([["admin", ROLE.ADMIN]] as const);
for (const mapRole of ownedMap.values()) acceptRole(mapRole);
for (const generatedRole of roleGenerator()) acceptRole(generatedRole);
void asyncRole().then(acceptRole);
acceptRole(await asyncRole());
acceptRole(overloaded(ROLE.ADMIN));
acceptRole(overloaded("ADMIN")); // @owned-error overload-raw
acceptRole(constrained(ROLE.ADMIN));
acceptRole(constrained("ADMIN")); // @owned-error constraint-raw
let reassigned: Role = ROLE.ADMIN;
reassigned = ROLE.USER;
reassigned = "ADMIN"; // @owned-error assignment-raw
acceptRole(reassigned);
role === ROLE.ADMIN;
role === "ADMIN"; // @owned-error comparison-raw
role === ACTOR.ADMIN; // @owned-error comparison-foreign
switch (role) {
  case ROLE.ADMIN:
  case "USER": // @owned-error switch-raw
    break;
  case ACTOR.ADMIN: // @owned-error switch-foreign
    break;
}
class Box<T> {
  public constructor(public readonly value: T) {}
  public map<U>(mapValue: (value: T) => U): Box<U> {
    return new Box(mapValue(this.value));
  }
}
const box = new Box(ROLE.ADMIN);
acceptRole(box.value);
acceptRole(box.map(identity).value);
type SchemaOutput<TSchema> = TSchema extends {
  parse(input: unknown): infer TOutput;
} ? TOutput : never;
const schemaValue: SchemaOutput<typeof roles> = roles.parse(input);
acceptRole(schemaValue);
const actorSchemaValue: SchemaOutput<typeof actors> = actors.parse(input);
acceptRole(actorSchemaValue); // @owned-error schema-foreign
`,
  "consumer.js": `
// @ts-check
/** @typedef {import("./roles").Role} Role */
/** @param {Role} role */
function acceptRole(role) { return role; }
const { ROLE, ACTOR } = require("./roles");
acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // @owned-error js-raw
acceptRole(ACTOR.ADMIN); // @owned-error js-foreign
`,
} as const;

const generatedCarrierDeclaration = String.raw`
declare enum RoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}
declare enum ActorCarrier {
  ADMIN = "ADMIN",
  BOT = "BOT",
}

interface NativeEnumRegistry {
  readonly roles: {
    readonly enum: {
      readonly ADMIN: RoleCarrier.ADMIN;
      readonly USER: RoleCarrier.USER;
      readonly GUEST: RoleCarrier.GUEST;
    };
  };
  readonly actors: {
    readonly enum: {
      readonly ADMIN: ActorCarrier.ADMIN;
      readonly BOT: ActorCarrier.BOT;
    };
  };
}

type RegistryEntry = NativeEnumRegistry[keyof NativeEnumRegistry];
type EntryMembers<TEntry> = TEntry extends {
  readonly enum: infer TEnum extends object;
} ? keyof TEnum : never;
type ExactEntry<TEntry, TMember extends PropertyKey> =
  [EntryMembers<TEntry>] extends [TMember]
    ? [TMember] extends [EntryMembers<TEntry>]
      ? TEntry
      : never
    : never;
type EntryFor<TMember extends string> = RegistryEntry extends infer TEntry
  ? TEntry extends unknown
    ? ExactEntry<TEntry, TMember>
    : never
  : never;
type EnumMapFor<TMember extends string> = EntryFor<TMember> extends {
  readonly enum: infer TEnum extends Readonly<Record<TMember, string>>;
} ? TEnum : never;

interface GeneratedEnumwaii<
  TMember extends string,
  TEnum extends Readonly<Record<TMember, string>>,
> {
  readonly enum: TEnum;
  readonly values: readonly TEnum[keyof TEnum][];
  readonly "~type": TEnum[keyof TEnum];
  parse(input: unknown): TEnum[keyof TEnum];
  derive<const TValue>(
    mapping: Readonly<Record<TMember, TValue>>,
  ): Readonly<Record<TMember, TValue>>;
}

declare function em<
  const TValues extends readonly [string, ...string[]],
>(values: TValues): GeneratedEnumwaii<
  TValues[number],
  EnumMapFor<TValues[number]>
>;
`;

const representationFixture = `
declare const requiredBrand: unique symbol;
declare const optionalBrand: unique symbol;
declare const containerBrand: unique symbol;

type HardOwned<TValue extends string, TSet extends string> = TValue & {
  readonly [requiredBrand]: {
    readonly set: TSet;
    readonly invariant: (set: TSet) => TSet;
  };
};
type SoftOwned<TValue extends string, TSet extends string> = TValue & {
  readonly [optionalBrand]?: TSet;
};
type RequiredRole =
  | HardOwned<"ADMIN", "ADMIN" | "USER">
  | HardOwned<"USER", "ADMIN" | "USER">;
type RequiredActor =
  | HardOwned<"ADMIN", "ADMIN" | "BOT">
  | HardOwned<"BOT", "ADMIN" | "BOT">;
type OptionalRole =
  | SoftOwned<"ADMIN", "ADMIN" | "USER">
  | SoftOwned<"USER", "ADMIN" | "USER">;

declare const REQUIRED_ROLE: {
  readonly ADMIN: HardOwned<"ADMIN", "ADMIN" | "USER">;
  readonly USER: HardOwned<"USER", "ADMIN" | "USER">;
};
declare const REQUIRED_ACTOR: {
  readonly ADMIN: HardOwned<"ADMIN", "ADMIN" | "BOT">;
  readonly BOT: HardOwned<"BOT", "ADMIN" | "BOT">;
};
declare const OPTIONAL_ROLE: {
  readonly ADMIN: SoftOwned<"ADMIN", "ADMIN" | "USER">;
  readonly USER: SoftOwned<"USER", "ADMIN" | "USER">;
};

// Required intersections reject both misuse classes.
// @ts-expect-error raw strings are not required-branded values
const requiredRaw: RequiredRole = "ADMIN";
// @ts-expect-error complete-set invariance rejects overlapping foreign values
const requiredForeign: RequiredRole = REQUIRED_ACTOR.ADMIN;
// @ts-expect-error a branded computed key is widened instead of remaining ADMIN
const requiredRecord: Record<"ADMIN", number> = {
  [REQUIRED_ROLE.ADMIN]: 1,
};
function requiredSwitch(value: RequiredRole): void {
  switch (value) {
    case REQUIRED_ROLE.ADMIN:
    case REQUIRED_ROLE.USER:
      return;
    default:
      // @ts-expect-error branded cases do not narrow the union to never
      const unreachable: never = value;
      void unreachable;
  }
}

// Optional brands preserve neither raw-string rejection nor literal keys.
const optionalRaw: OptionalRole = "ADMIN";
void optionalRaw;
// @ts-expect-error optional intersections still widen computed keys
const optionalRecord: Record<"ADMIN", number> = {
  [OPTIONAL_ROLE.ADMIN]: 1,
};

// Container-only identity leaves primitive members completely structural.
type ContainerEnum<TMember extends string> = {
  readonly enum: { readonly [TKey in TMember]: TKey } & {
    readonly [containerBrand]: TMember;
  };
  readonly "~type": TMember;
};
declare const containerRoles: ContainerEnum<"ADMIN" | "USER">;
declare const containerActors: ContainerEnum<"ADMIN" | "BOT">;
type ContainerRole = typeof containerRoles["~type"];
const containerRaw: ContainerRole = "ADMIN";
const containerForeign: ContainerRole = containerActors.enum.ADMIN;
const containerRecord: Record<"ADMIN", number> = {
  [containerRoles.enum.ADMIN]: 1,
};
void containerRaw;
void containerForeign;
void containerRecord;
`;

const generatedCarrierFixture = `
${generatedCarrierDeclaration}
const roles = em(["ADMIN", "USER", "GUEST"]);
const sameRoles = em(["GUEST", "ADMIN", "USER"]);
const actors = em(["ADMIN", "BOT"]);
const ROLE = roles.enum;
const ACTOR = actors.enum;
type Role = typeof roles["~type"];
declare const input: unknown;
declare function acceptRole(role: Role): void;
function identity<T>(value: T): T { return value; }

acceptRole(ROLE.ADMIN);
acceptRole(sameRoles.enum.ADMIN);
// @ts-expect-error native enum carrier rejects raw strings
acceptRole("ADMIN");
// @ts-expect-error a different generated complete set is nominally foreign
acceptRole(ACTOR.ADMIN);
const raw = "ADMIN" as const;
// @ts-expect-error raw aliases remain raw
acceptRole(raw);
const owned = ROLE.ADMIN;
acceptRole(owned);
acceptRole(roles.parse(input));
acceptRole(identity(ROLE.ADMIN));
// @ts-expect-error generic identity does not invent carrier ownership
acceptRole(identity("ADMIN" as const));
[ROLE.ADMIN].map((role) => acceptRole(role));
new Set([ROLE.ADMIN]).forEach(acceptRole);
Promise.resolve(ROLE.ADMIN).then(acceptRole);
const ownedMap = new Map([["admin", ROLE.ADMIN]] as const);
for (const role of ownedMap.values()) acceptRole(role);
const labels = roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});
void labels;
function exhaustive(role: Role): string {
  switch (role) {
    case ROLE.ADMIN: return "admin";
    case ROLE.USER: return "user";
    case ROLE.GUEST: return "guest";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}
void exhaustive;
const stringValue: string = ROLE.ADMIN;
void stringValue;
`;

const dualSurfaceFixture = `
declare const ownedBrand: unique symbol;
type Owned<TValue extends string, TSet extends string> = TValue & {
  readonly [ownedBrand]: {
    readonly set: TSet;
    readonly invariant: (set: TSet) => TSet;
  };
};
type Role = "ADMIN" | "USER" | "GUEST";
type OwnedRole =
  | Owned<"ADMIN", Role>
  | Owned<"USER", Role>
  | Owned<"GUEST", Role>;
type OwnedActor =
  | Owned<"ADMIN", "ADMIN" | "BOT">
  | Owned<"BOT", "ADMIN" | "BOT">;
declare const roles: {
  readonly enum: { readonly [TKey in Role]: TKey };
  readonly token: {
    readonly ADMIN: Owned<"ADMIN", Role>;
    readonly USER: Owned<"USER", Role>;
    readonly GUEST: Owned<"GUEST", Role>;
  };
  parse(input: unknown): OwnedRole;
  derive<const TValue>(mapping: Readonly<Record<Role, TValue>>): void;
};
declare const actors: {
  readonly token: {
    readonly ADMIN: Owned<"ADMIN", "ADMIN" | "BOT">;
    readonly BOT: Owned<"BOT", "ADMIN" | "BOT">;
  };
};
declare const input: unknown;
declare function acceptOwned(role: OwnedRole): void;
const ROLE = roles.enum;
acceptOwned(roles.token.ADMIN);
acceptOwned(roles.parse(input));
// @ts-expect-error native members are deliberately not strict boundary tokens
acceptOwned(ROLE.ADMIN);
// @ts-expect-error raw strings are not strict boundary tokens
acceptOwned("ADMIN");
// @ts-expect-error overlapping foreign tokens have a different complete set
acceptOwned(actors.token.ADMIN as OwnedActor);
roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});
function exhaustive(role: Role): void {
  switch (role) {
    case ROLE.ADMIN:
    case ROLE.USER:
    case ROLE.GUEST:
      return;
    default: {
      const unreachable: never = role;
      void unreachable;
    }
  }
}
void exhaustive;
`;

async function disposeAll(projects: readonly VirtualProject[]): Promise<void> {
  await Promise.all(projects.map((project) => project.dispose()));
}

function expectedKind(tag: string): OwnershipIssueKind {
  if (tag.includes("assertion")) return "unsafe-assertion";
  return tag.includes("foreign") ? "foreign-enum" : "raw-string";
}

function generateFlowSource(enumCount: number): string {
  const declarations: string[] = [
    'import { em } from "./api";',
    "function identity<T>(value: T): T { return value; }",
    "declare function consume<T>(value: T): void;",
  ];
  for (let index = 1; index <= enumCount; index += 1) {
    const suffix = String(index).padStart(2, "0");
    declarations.push(
      `const enum${suffix} = em(["A${suffix}", "B${suffix}", "C${suffix}", "D${suffix}"]);`,
      `const value${suffix} = identity(enum${suffix}.enum.A${suffix});`,
      `const values${suffix} = [...enum${suffix}.values];`,
      `new Set(values${suffix}).forEach((value) => consume(value));`,
      `Promise.resolve(value${suffix}).then((value) => consume(value));`,
      `consume<typeof enum${suffix}["~type"]>(value${suffix});`,
    );
  }
  return declarations.join("\n");
}

function generateCarrierApi(enumCount: number): string {
  const enums: string[] = [];
  const entries: string[] = [];
  for (let index = 1; index <= enumCount; index += 1) {
    const suffix = String(index).padStart(2, "0");
    enums.push(
      `declare enum Carrier${suffix} { A${suffix} = "A${suffix}", B${suffix} = "B${suffix}", C${suffix} = "C${suffix}", D${suffix} = "D${suffix}" }`,
    );
    entries.push(
      `readonly set${suffix}: { readonly enum: { readonly A${suffix}: Carrier${suffix}.A${suffix}; readonly B${suffix}: Carrier${suffix}.B${suffix}; readonly C${suffix}: Carrier${suffix}.C${suffix}; readonly D${suffix}: Carrier${suffix}.D${suffix}; }; };`,
    );
  }
  return `${enums.join("\n")}
interface NativeEnumRegistry { ${entries.join("\n")} }
type RegistryEntry = NativeEnumRegistry[keyof NativeEnumRegistry];
type EntryMembers<TEntry> = TEntry extends { readonly enum: infer TEnum extends object } ? keyof TEnum : never;
type ExactEntry<TEntry, TMember extends PropertyKey> = [EntryMembers<TEntry>] extends [TMember] ? [TMember] extends [EntryMembers<TEntry>] ? TEntry : never : never;
type EntryFor<TMember extends string> = RegistryEntry extends infer TEntry ? TEntry extends unknown ? ExactEntry<TEntry, TMember> : never : never;
type EnumMapFor<TMember extends string> = EntryFor<TMember> extends { readonly enum: infer TEnum extends Readonly<Record<TMember, string>> } ? TEnum : never;
interface GeneratedEnumwaii<TMember extends string, TEnum extends Readonly<Record<TMember, string>>> {
  readonly enum: TEnum;
  readonly values: readonly TEnum[keyof TEnum][];
  readonly "~type": TEnum[keyof TEnum];
}
declare function em<const TValues extends readonly [string, ...string[]]>(values: TValues): GeneratedEnumwaii<TValues[number], EnumMapFor<TValues[number]>>;
export { em };`;
}

interface InvestigationMetrics {
  readonly typescriptVersion: string;
  readonly brandless: ProgramMetrics;
  readonly branded: ProgramMetrics;
  readonly generatedCarrier: ProgramMetrics;
  readonly provenanceAnalysisMs: number;
  readonly proposedTotalCheckMs: number;
}

describe("brandless enumwaii investigation", () => {
  it("proves container-only native values cannot reject raw or overlapping foreign members", async () => {
    const project = await createVirtualProject({
      "api.d.ts": nativeApiDeclaration,
      "consumer.ts": `
import { em } from "./api";
const roles = em(["ADMIN", "USER", "GUEST"]);
const actors = em(["ADMIN", "BOT"]);
const ROLE = roles.enum;
const ACTOR = actors.enum;
type Role = typeof roles["~type"];
declare function acceptRole(role: Role): void;
acceptRole(ROLE.ADMIN);
acceptRole("ADMIN");
const raw = "ADMIN" as const;
acceptRole(raw);
acceptRole(ACTOR.ADMIN);
`,
    });
    try {
      expect(collectDiagnostics(project)).toEqual([]);
    } finally {
      await project.dispose();
    }
  });

  it("preserves native computed keys, exhaustive derive, and switch narrowing", async () => {
    const project = await createVirtualProject({
      "api.d.ts": nativeApiDeclaration,
      "consumer.ts": `
import { em } from "./api";
const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
type Role = typeof roles["~type"];
const labels = roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});
const exact: Readonly<Record<Role, string>> = labels;
void exact;
function exhaustive(role: Role): string {
  switch (role) {
    case ROLE.ADMIN: return "admin";
    case ROLE.USER: return "user";
    case ROLE.GUEST: return "guest";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}
void exhaustive;
`,
    });
    try {
      expect(collectDiagnostics(project)).toEqual([]);
    } finally {
      await project.dispose();
    }
  });

  it("uses a shadow program to preserve provenance through generic library flow", async () => {
    const project = await createVirtualProject(ownershipFiles, {
      moduleDetection: 3,
    });
    try {
      const actual = analyzeOwnership(project).map((issue) => ({
        file: issue.file,
        line: issue.line,
        kind: issue.kind,
      }));
      const expected = expectedIssueLocations(ownershipFiles)
        .map((issue) => ({
          file: issue.file,
          line: issue.line,
          kind: expectedKind(issue.tag),
        }))
        .sort(
          (left, right) =>
            left.file.localeCompare(right.file) || left.line - right.line,
        );
      expect(actual).toEqual(expected);
    } finally {
      await project.dispose();
    }
  });

  it("documents the representation boundary and two viable alternatives", async () => {
    const projects = await Promise.all([
      createVirtualProject({ "representation.ts": representationFixture }),
      createVirtualProject({ "generated.ts": generatedCarrierFixture }),
      createVirtualProject({ "dual-surface.ts": dualSurfaceFixture }),
    ]);
    try {
      expect(projects.map((project) => collectDiagnostics(project))).toEqual([
        [],
        [],
        [],
      ]);
    } finally {
      await disposeAll(projects);
    }
  });

  it("keeps candidate runtime values primitive and serialization-neutral", () => {
    function runtimeEnum<const TValues extends readonly [string, ...string[]]>(
      values: TValues,
    ): {
      readonly enum: { readonly [TKey in TValues[number]]: TKey };
      readonly values: TValues;
    } {
      return {
        enum: Object.freeze(
          Object.fromEntries(values.map((value) => [value, value])),
        ) as { readonly [TKey in TValues[number]]: TKey },
        values: Object.freeze([...values]) as unknown as TValues,
      };
    }

    const roles = runtimeEnum(["ADMIN", "USER", "GUEST"]);
    expect(typeof roles.enum.ADMIN).toBe("string");
    expect(roles.enum.ADMIN).toBe("ADMIN");
    expect(JSON.stringify({ role: roles.enum.ADMIN })).toBe('{"role":"ADMIN"}');
    expect(new URLSearchParams({ role: roles.enum.ADMIN }).toString()).toBe(
      "role=ADMIN",
    );
    expect(structuredClone(roles.enum.ADMIN)).toBe("ADMIN");
  });

  it("prints TypeScript and provenance-core performance measurements", async () => {
    const enumCount = 32;
    const source = generateFlowSource(enumCount);
    const projects = await Promise.all([
      createVirtualProject({
        "api.d.ts": nativeApiDeclaration,
        "bench.ts": source,
      }),
      createVirtualProject({
        "api.d.ts": shadowApiDeclaration,
        "bench.ts": source,
      }),
      createVirtualProject({
        "api.d.ts": generateCarrierApi(enumCount),
        "bench.ts": source,
      }),
    ]);
    try {
      const measured = projects.map(measureProgram);
      const brandless = measured[0]!;
      const branded = measured[1]!;
      const generatedCarrier = measured[2]!;
      expect(brandless.diagnostics).toBe(0);
      expect(branded.diagnostics).toBe(0);
      expect(generatedCarrier.diagnostics).toBe(0);
      const analysisStart = performance.now();
      const issues = analyzeOwnership(projects[1]!);
      const provenanceAnalysisMs = performance.now() - analysisStart;
      expect(issues).toEqual([]);
      const metrics: InvestigationMetrics = {
        typescriptVersion: (await import("typescript")).version,
        brandless,
        branded,
        generatedCarrier,
        provenanceAnalysisMs,
        proposedTotalCheckMs:
          brandless.checkMs + branded.checkMs + provenanceAnalysisMs,
      };
      process.stdout.write(
        `ENUMWAII_BRANDLESS_METRICS ${JSON.stringify(metrics)}\n`,
      );
    } finally {
      await disposeAll(projects);
    }
  });
});
