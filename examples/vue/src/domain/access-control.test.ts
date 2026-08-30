import { describe, expect, it } from "vitest";

import {
  ACCESS_LEVELS,
  canAccess,
  parseAccessLevel,
  permissionsFor,
  PERMISSIONS,
} from "./access-control";

describe("access-control boundary", () => {
  it("returns the canonical branded member for a valid payload", () => {
    const result = parseAccessLevel("EDITOR", "strict");

    expect(result).toEqual({ success: true, value: ACCESS_LEVELS.EDITOR });
  });

  it("keeps a nil-only default distinct from malformed input", () => {
    const missing = parseAccessLevel(undefined, "nil-default");
    const malformed = parseAccessLevel("ARCHIVED", "nil-default");

    expect(missing).toEqual({ success: true, value: ACCESS_LEVELS.VIEWER });
    expect(malformed.success).toBe(false);
  });

  it("uses fallback for malformed and wrong-shaped input", () => {
    const malformed = parseAccessLevel("ARCHIVED", "fallback");
    const wrongShape = parseAccessLevel({ level: "EDITOR" }, "fallback");

    expect(malformed).toEqual({ success: true, value: ACCESS_LEVELS.GUEST });
    expect(wrongShape).toEqual({ success: true, value: ACCESS_LEVELS.GUEST });
  });

  it("derives real permissions exhaustively from the access level", () => {
    expect(permissionsFor(ACCESS_LEVELS.OWNER)).toEqual([
      PERMISSIONS.READ,
      PERMISSIONS.WRITE,
      PERMISSIONS.INVITE,
      PERMISSIONS.BILLING,
    ]);
    expect(permissionsFor(ACCESS_LEVELS.VIEWER)).toEqual([PERMISSIONS.READ]);
    expect(canAccess(ACCESS_LEVELS.EDITOR, PERMISSIONS.INVITE)).toBe(true);
    expect(canAccess(ACCESS_LEVELS.GUEST, PERMISSIONS.WRITE)).toBe(false);
  });
});
