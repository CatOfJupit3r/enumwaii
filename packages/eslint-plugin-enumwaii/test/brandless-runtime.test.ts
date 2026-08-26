import { describe, expect, it } from "vitest";

import { em } from "../../../experiments/brandless-research/brandless";
import { emNative } from "../../../experiments/brandless-research/native-carrier";

declare enum RoleCarrier {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

describe("brandless runtime behavior", () => {
  it("keeps members as primitive strings with ordinary serialization", () => {
    const roles = em(["ADMIN", "USER", "GUEST"]);
    const role = roles.enum.ADMIN;

    expect(typeof role).toBe("string");
    expect(role).toBe("ADMIN");
    expect(JSON.stringify(role)).toBe('"ADMIN"');
    expect(new URLSearchParams({ role }).toString()).toBe("role=ADMIN");
    expect(structuredClone(role)).toBe("ADMIN");
    expect(JSON.parse(JSON.stringify({ role }))).toEqual({ role: "ADMIN" });

    const markerSymbols = Object.getOwnPropertySymbols(roles.enum);
    expect(markerSymbols.length).toBeGreaterThan(0);
    expect(
      markerSymbols.every(
        (symbol) =>
          Object.getOwnPropertyDescriptor(roles.enum, symbol)?.enumerable ===
          false,
      ),
    ).toBe(true);
    expect(JSON.stringify(roles.enum)).toBe(
      '{"ADMIN":"ADMIN","USER":"USER","GUEST":"GUEST"}',
    );
  });

  it("keeps generated native carriers runtime-equivalent", () => {
    const roles = emNative<RoleCarrier>()(["ADMIN", "USER", "GUEST"]);
    const role = roles.enum.ADMIN;

    expect(typeof role).toBe("string");
    expect(role).toBe("ADMIN");
    expect(JSON.stringify(role)).toBe('"ADMIN"');
    expect(structuredClone(role)).toBe("ADMIN");
    expect(roles.parse("USER")).toBe("USER");
    expect(() => roles.parse("BOT")).toThrow(TypeError);
  });
});
