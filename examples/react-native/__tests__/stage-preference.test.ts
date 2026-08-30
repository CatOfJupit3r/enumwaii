import { DISPATCH_STAGE } from "../src/domain/dispatch";
import {
  clearStagePreference,
  loadStagePreference,
  saveStagePreference,
  STAGE_PREFERENCE_KEY,
  type StringStorage,
} from "../src/persistence/stage-preference";

function createMemoryStorage(initial: string | null): StringStorage & {
  readonly values: Map<string, string>;
} {
  const values = new Map<string, string>();
  if (initial !== null) values.set(STAGE_PREFERENCE_KEY, initial);

  return {
    values,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

describe("AsyncStorage stage boundary", () => {
  test("uses a nil-only default when no preference exists", async () => {
    const result = await loadStagePreference(createMemoryStorage(null));

    expect(result).toMatchObject({
      stage: DISPATCH_STAGE.UNASSIGNED,
      source: "default",
      raw: null,
    });
  });

  test("hydrates a valid persisted string into its branded member", async () => {
    const result = await loadStagePreference(createMemoryStorage("DISPATCHED"));

    expect(result).toMatchObject({
      stage: DISPATCH_STAGE.DISPATCHED,
      source: "stored",
      raw: "DISPATCHED",
    });
  });

  test("recovers explicitly from stale or corrupt persisted data", async () => {
    const result = await loadStagePreference(createMemoryStorage("ARCHIVED"));

    expect(result).toMatchObject({
      stage: DISPATCH_STAGE.UNASSIGNED,
      source: "fallback",
      raw: "ARCHIVED",
    });
  });

  test("persists members as normal strings and can remove them", async () => {
    const storage = createMemoryStorage(null);

    await saveStagePreference(storage, DISPATCH_STAGE.RESOLVED);
    expect(storage.values.get(STAGE_PREFERENCE_KEY)).toBe("RESOLVED");

    await clearStagePreference(storage);
    expect(storage.values.has(STAGE_PREFERENCE_KEY)).toBe(false);
  });
});
