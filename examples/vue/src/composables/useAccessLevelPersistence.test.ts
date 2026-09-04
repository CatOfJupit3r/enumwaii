import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";

import { ACCESS_LEVELS } from "../domain/access-control";
import { useAccessLevelPersistence } from "./useAccessLevelPersistence";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("useAccessLevelPersistence", () => {
  it("defaults a fresh visit to Viewer", () => {
    const state = useAccessLevelPersistence();

    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.source.value).toBe("DEFAULT");
    expect(state.outcome.value).toBe("DEFAULTED");
    expect(state.message.value).toBeNull();
  });

  it("falls back visibly when a tampered URL contains an unknown role", () => {
    window.history.replaceState({}, "", "/?as=SUPERADMIN");
    const state = useAccessLevelPersistence();

    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.source.value).toBe("URL");
    expect(state.outcome.value).toBe("FALLBACK");
    expect(state.message.value).toContain("Unknown role");
    expect(state.message.value).toContain("showing as Viewer");
  });

  it("strictly rejects and removes corrupt localStorage", () => {
    window.localStorage.setItem("crewboard-view-as", "ARCHIVED");
    const state = useAccessLevelPersistence();

    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.source.value).toBe("LOCAL_STORAGE");
    expect(state.outcome.value).toBe("RESET");
    expect(window.localStorage.getItem("crewboard-view-as")).toBeNull();
  });

  it("accepts a valid role and syncs both persistence channels", async () => {
    const state = useAccessLevelPersistence();

    const result = state.setFromExternal(ACCESS_LEVELS.EDITOR);
    await nextTick();

    expect(result).toEqual({ success: true, value: ACCESS_LEVELS.EDITOR });
    expect(state.level.value).toBe(ACCESS_LEVELS.EDITOR);
    expect(window.localStorage.getItem("crewboard-view-as")).toBe("editor");
    expect(new URL(window.location.href).searchParams.get("as")).toBe("editor");
  });

  it("keeps a wrong-shaped object out of state", () => {
    const state = useAccessLevelPersistence();

    const result = state.setFromExternal({ level: "editor" });

    expect(result.success).toBe(false);
    expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
    expect(state.outcome.value).toBe("REJECTED");
  });
});

it("clears an edited role without the hydration watcher restoring persistence", async () => {
  const state = useAccessLevelPersistence();
  state.setFromExternal(ACCESS_LEVELS.EDITOR);
  await nextTick();
  state.clearPersistence();
  await nextTick();
  expect(state.level.value).toBe(ACCESS_LEVELS.VIEWER);
  expect(window.localStorage.getItem("crewboard-view-as")).toBeNull();
  expect(new URL(window.location.href).searchParams.has("as")).toBe(false);
});

it("rejects uppercase role keys in URLs and accepts canonical wire values", () => {
  window.history.replaceState({}, "", "/?as=EDITOR");
  expect(useAccessLevelPersistence().outcome.value).toBe("FALLBACK");
  window.history.replaceState({}, "", "/?as=editor");
  expect(useAccessLevelPersistence().level.value).toBe(ACCESS_LEVELS.EDITOR);
});
