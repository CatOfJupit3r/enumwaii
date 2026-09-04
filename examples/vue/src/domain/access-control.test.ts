import { describe, expect, it } from "vitest";

import {
  ACCESS_POLICY,
  ACCESS_POLICY_VALUES,
  ACCESS_LEVELS,
  INVITABLE_ACCESS_LEVEL_VALUES,
  canAccess,
  parseAccessLevel,
  permissionsFor,
  PERMISSIONS,
  policyDescription,
  policyLabel,
} from "./access-control";

describe("access-control boundary", () => {
  it("returns the canonical branded member for a valid payload", () => {
    const result = parseAccessLevel("editor", ACCESS_POLICY.STRICT);

    expect(result).toEqual({ success: true, value: ACCESS_LEVELS.EDITOR });
  });

  it("keeps a nil-only default distinct from malformed input", () => {
    const missing = parseAccessLevel(undefined, ACCESS_POLICY.NIL_DEFAULT);
    const malformed = parseAccessLevel("ARCHIVED", ACCESS_POLICY.NIL_DEFAULT);

    expect(missing).toEqual({ success: true, value: ACCESS_LEVELS.VIEWER });
    expect(malformed.success).toBe(false);
  });

  it("uses fallback for malformed and wrong-shaped input", () => {
    const malformed = parseAccessLevel("ARCHIVED", ACCESS_POLICY.FALLBACK);
    const wrongShape = parseAccessLevel(
      { level: "editor" },
      ACCESS_POLICY.FALLBACK,
    );

    expect(malformed).toEqual({ success: true, value: ACCESS_LEVELS.VIEWER });
    expect(wrongShape).toEqual({ success: true, value: ACCESS_LEVELS.VIEWER });
  });

  it("derives exhaustive policy metadata and behavior from owned members", () => {
    expect(ACCESS_POLICY_VALUES).toEqual([
      ACCESS_POLICY.STRICT,
      ACCESS_POLICY.NIL_DEFAULT,
      ACCESS_POLICY.FALLBACK,
    ]);
    expect(policyLabel(ACCESS_POLICY.STRICT)).toBe("Strict rejection");
    expect(policyDescription(ACCESS_POLICY.NIL_DEFAULT)).toContain(
      "null and undefined",
    );

    const malformed = parseAccessLevel(
      { level: "editor" },
      ACCESS_POLICY.STRICT,
    );
    expect(malformed.success).toBe(false);
    if (!malformed.success) {
      expect(malformed.error.receivedText).toBe('{"level":"editor"}');
    }
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
    expect(INVITABLE_ACCESS_LEVEL_VALUES).toEqual([
      ACCESS_LEVELS.EDITOR,
      ACCESS_LEVELS.VIEWER,
      ACCESS_LEVELS.GUEST,
    ]);
  });
});
