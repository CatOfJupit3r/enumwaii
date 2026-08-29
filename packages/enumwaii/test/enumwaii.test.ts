import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { inspect } from "node:util";

import { em, EnumwaiiError, EnumwaiiParseError } from "../src/index";
import { valibotSchema } from "../src/adapters/valibot";
import { lowercase, uppercase } from "../src/derive-with";
import { zodSchema } from "../src/adapters/zod";
import * as v from "valibot";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;

describe("em", () => {
  it("creates frozen, plain member objects", () => {
    expect(ROLE.ADMIN).toBe("ADMIN");
    expect(RAW_ROLE.ADMIN).toBe("ADMIN");
    expect(roles.values).toEqual(["ADMIN", "USER", "GUEST"]);
    expect(Object.isFrozen(ROLE)).toBe(true);
    expect(Object.isFrozen(roles.rawEnum)).toBe(true);
    expect(Object.is(roles.enum, roles.rawEnum)).toBe(true);
    expect(Object.is(roles.enum, roles.cases)).toBe(true);
    expect((ROLE as Record<string, unknown>).MISSING).toBeUndefined();
    expect((roles.rawEnum as Record<string, unknown>).MISSING).toBeUndefined();
  });

  it("owns mutable input without exposing an enum name", () => {
    const source: [string, ...string[]] = ["one", "two"];
    const anonymous = em(source);
    source[0] = "changed";
    expect(anonymous.rawValues).toEqual(["one", "two"]);
    expect("name" in anonymous).toBe(false);
  });

  it("deduplicates declarations and rejects empty declarations", () => {
    expect(em(["A", "A", "B", "A"]).rawValues).toEqual(["A", "B"]);
    expect(() => em([] as never)).toThrow(/^An enum must/);
  });
});

describe("deserialization", () => {
  it("parses and narrows branded strings", () => {
    expect(roles.parse("ADMIN")).toBe(ROLE.ADMIN);
    expect(roles.is("USER")).toBe(true);
    expect(() => roles.parse("OWNER")).toThrow(EnumwaiiParseError);
    expect(() => roles.parse("OWNER")).toThrow(/^Cannot parse/);
  });

  it("supports nil defaults and invalid-input fallbacks", () => {
    expect(roles.parse(undefined, { default: ROLE.USER })).toBe(ROLE.USER);
    expect(roles.parse(null, { default: ROLE.USER })).toBe(ROLE.USER);
    expect(roles.parse("OWNER", { fallback: ROLE.GUEST })).toBe(ROLE.GUEST);
    expect(
      roles.parse(null, {
        default: ROLE.ADMIN,
        fallback: ROLE.GUEST,
      }),
    ).toBe(ROLE.ADMIN);
    expect(roles.safeParse("OWNER", { fallback: ROLE.USER })).toEqual({
      success: true,
      value: ROLE.USER,
    });
  });

  it("returns a discriminated safeParse result", () => {
    expect(roles.safeParse("USER")).toEqual({ success: true, value: "USER" });
    const failure = roles.safeParse(null);
    expect(failure.success).toBe(false);
    if (!failure.success)
      expect(failure.error).toBeInstanceOf(EnumwaiiParseError);
  });

  it("implements Standard Schema v1 without an adapter", () => {
    expect(roles["~standard"].validate("ADMIN")).toEqual({ value: "ADMIN" });
    expect(roles["~standard"].validate("OWNER")).toMatchObject({
      issues: [{ message: expect.any(String) }],
    });

    const validate = roles["~standard"].validate;
    expect(validate("USER")).toEqual({ value: "USER" });
  });

  it("supports standard object-probing protocols", async () => {
    expect(JSON.stringify(roles.enum)).toBe(
      '{"ADMIN":"ADMIN","USER":"USER","GUEST":"GUEST"}',
    );
    await expect(Promise.resolve(roles.enum)).resolves.toBe(roles.enum);
    expect(isValidElement(roles.enum)).toBe(false);
    expect(inspect(roles.enum)).toContain("ADMIN");
    expect(roles.enum).toEqual({
      ADMIN: "ADMIN",
      USER: "USER",
      GUEST: "GUEST",
    });
    expect(
      (roles.enum as Record<string, unknown>).asymmetricMatch,
    ).toBeUndefined();
  });

  it("offers optional Zod and Valibot adapters", () => {
    expect(zodSchema(roles).parse("ADMIN")).toBe(ROLE.ADMIN);
    expect(() => zodSchema(roles).parse("OWNER")).toThrow();
    expect(v.parse(valibotSchema(roles), "USER")).toBe(ROLE.USER);
    expect(() => v.parse(valibotSchema(roles), "OWNER")).toThrow();
  });
});

describe("composition and exhaustive derivation", () => {
  it("picks, omits, extends, and combines values", () => {
    expect(roles.pick([ROLE.ADMIN, ROLE.USER]).rawValues).toEqual([
      "ADMIN",
      "USER",
    ]);
    expect(roles.omit([ROLE.GUEST]).rawValues).toEqual(["ADMIN", "USER"]);
    expect(roles.extend(["BOT"]).rawValues).toEqual([
      "ADMIN",
      "USER",
      "GUEST",
      "BOT",
    ]);
    expect(roles.extend(["USER", "BOT", "USER"]).rawValues).toEqual([
      "ADMIN",
      "USER",
      "GUEST",
      "BOT",
    ]);

    const access = em(["USER", "FULL", "NONE"]);
    expect(em.combine([roles, access]).rawValues).toEqual([
      "ADMIN",
      "USER",
      "GUEST",
      "FULL",
      "NONE",
    ]);
  });

  it("builds checked lookup maps", () => {
    const labels = roles.derive(
      [ROLE.ADMIN, "Administrator"],
      [ROLE.USER, "Member"],
      [ROLE.GUEST, "Guest"],
    );
    expect(labels.get(ROLE.ADMIN)).toBe("Administrator");
    expect(labels.record.USER).toBe("Member");
    expect(Object.isFrozen(labels.record)).toBe(true);
    expect((labels.record as Record<string, unknown>).MISSING).toBeUndefined();
    expect(() => roles.derive([ROLE.ADMIN, "Administrator"] as never)).toThrow(
      EnumwaiiError,
    );
    const deriveUnchecked = roles.derive.bind(roles) as (
      ...entries: readonly (readonly [string, string])[]
    ) => unknown;
    expect(() =>
      deriveUnchecked(
        [ROLE.ADMIN, "First"],
        [ROLE.ADMIN, "Second"],
        [ROLE.USER, "Member"],
        [ROLE.GUEST, "Guest"],
      ),
    ).toThrow(EnumwaiiError);
  });

  it("derives values with optional helper functions", () => {
    const lowerRoles = roles.derive(lowercase);
    const lowerRolesFromMethod = roles.derive((role) => role.toLowerCase());
    const lower = em(["admin", "user"]);
    const LOWER = lower.enum;
    const upperRoles = lower.derive(uppercase);

    expect(lowerRoles.get(ROLE.ADMIN)).toBe("admin");
    expect(lowerRolesFromMethod.get(ROLE.USER)).toBe("user");
    expect(upperRoles.get(LOWER.user)).toBe("USER");
  });

  it("derives scalar and array values into another enum", () => {
    const permissions = em(["READ", "WRITE", "DELETE"]);
    const PERMISSION = permissions.enum;
    const grants = roles.deriveTo(
      permissions,
      [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE, PERMISSION.DELETE]],
      [ROLE.USER, [PERMISSION.READ, PERMISSION.WRITE]],
      [ROLE.GUEST, PERMISSION.READ],
    );

    expect(grants.get(ROLE.ADMIN)).toEqual(["READ", "WRITE", "DELETE"]);
    expect(grants.get(ROLE.GUEST)).toBe(PERMISSION.READ);
    expect(() =>
      roles.deriveTo(
        permissions,
        [ROLE.ADMIN, [PERMISSION.READ, "UNKNOWN" as never]],
        [ROLE.USER, PERMISSION.READ],
        [ROLE.GUEST, []],
      ),
    ).toThrow(EnumwaiiError);
  });
});
