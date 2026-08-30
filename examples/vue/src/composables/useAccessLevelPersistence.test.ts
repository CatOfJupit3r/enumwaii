import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";

import { ACCESS_LEVELS, ACCESS_POLICY } from "../domain/access-control";
import { useAccessLevelPersistence } from "./useAccessLevelPersistence";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("useAccessLevelPersistence", () => {
  it("starts with the explicit nil default when storage is missing", () => {
    const state = useAccessLevelPersistence({
      policy: ACCESS_POLICY.NIL_DEFAULT,
    });

    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.source.value).toBe("default");
    expect(state.outcome.value).toBe("accepted");
  });

  it("does not admit malformed URL input under strict policy", () => {
    window.history.replaceState({}, "", "/?level=ARCHIVED");
    const state = useAccessLevelPersistence({ policy: ACCESS_POLICY.STRICT });

    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.source.value).toBe("url");
    expect(state.outcome.value).toBe("rejected");
    expect(state.errorMessage.value).toContain("Cannot parse");
  });

  it("accepts a valid external value and syncs it to both persistence channels", async () => {
    const state = useAccessLevelPersistence({ policy: ACCESS_POLICY.STRICT });

    const result = state.setFromExternal(ACCESS_LEVELS.EDITOR);
    await nextTick();

    expect(result).toEqual({ success: true, value: ACCESS_LEVELS.EDITOR });
    expect(state.level.value).toBe(ACCESS_LEVELS.EDITOR);
    expect(window.localStorage.getItem("enumwaii-console-level")).toBe(
      "EDITOR",
    );
    expect(new URL(window.location.href).searchParams.get("level")).toBe(
      "EDITOR",
    );
  });

  it("keeps a wrong-shaped object out of state even when it looks close", () => {
    const state = useAccessLevelPersistence({ policy: ACCESS_POLICY.STRICT });

    const result = state.setFromExternal({ level: "EDITOR" });

    expect(result.success).toBe(false);
    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.outcome.value).toBe("rejected");
  });
});
