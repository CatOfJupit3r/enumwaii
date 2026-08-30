import {
  DISPATCH_STAGE,
  dispatchStageSchema,
  type DispatchStage,
} from "../domain/dispatch";

export const STAGE_PREFERENCE_KEY = "enumwaii-field-dispatch-stage";

export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StagePreferenceHydration {
  readonly stage: DispatchStage;
  readonly source: "stored" | "default" | "fallback";
  readonly raw: string | null;
  readonly notice: string;
}

export async function loadStagePreference(
  storage: StringStorage,
): Promise<StagePreferenceHydration> {
  const raw = await storage.getItem(STAGE_PREFERENCE_KEY);
  const defaultOnly = dispatchStageSchema.safeParse(raw, {
    default: DISPATCH_STAGE.UNASSIGNED,
  });

  if (defaultOnly.success) {
    const defaulted = raw === null;
    return {
      stage: defaultOnly.value,
      source: defaulted ? "default" : "stored",
      raw,
      notice: defaulted
        ? "No preference was stored, so the nil-only default opened Unassigned."
        : "AsyncStorage returned a string that was validated before entering state.",
    };
  }

  return {
    stage: dispatchStageSchema.parse(raw, {
      fallback: DISPATCH_STAGE.UNASSIGNED,
    }),
    source: "fallback",
    raw,
    notice:
      "Stored data was malformed. The explicit fallback recovered without trusting it.",
  };
}

export async function saveStagePreference(
  storage: StringStorage,
  stage: DispatchStage,
): Promise<void> {
  await storage.setItem(STAGE_PREFERENCE_KEY, stage);
}

export async function clearStagePreference(
  storage: StringStorage,
): Promise<void> {
  await storage.removeItem(STAGE_PREFERENCE_KEY);
}
