import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { DISPATCH_STAGE, type DispatchStage } from "../domain/dispatch";
import {
  clearStagePreference,
  loadStagePreference,
  saveStagePreference,
  STAGE_PREFERENCE_KEY,
  type StagePreferenceHydration,
} from "../persistence/stage-preference";

export interface StagePreferenceController extends StagePreferenceHydration {
  readonly loading: boolean;
  readonly error: string | null;
  select(stage: DispatchStage): Promise<void>;
  writeRaw(raw: string): Promise<void>;
  reset(): Promise<void>;
  reload(): Promise<void>;
}

const INITIAL_HYDRATION: StagePreferenceHydration = {
  stage: DISPATCH_STAGE.UNASSIGNED,
  source: "default",
  raw: null,
  notice: "Reading the saved mobile preference…",
};

export function useStagePreference(): StagePreferenceController {
  const [hydration, setHydration] =
    useState<StagePreferenceHydration>(INITIAL_HYDRATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async function reload(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      setHydration(await loadStagePreference(AsyncStorage));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The stage preference could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const select = useCallback(async function select(
    stage: DispatchStage,
  ): Promise<void> {
    setError(null);
    try {
      await saveStagePreference(AsyncStorage, stage);
      setHydration({
        stage,
        source: "stored",
        raw: stage,
        notice:
          "The branded member serialized as a normal string and was persisted.",
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The stage preference could not be saved.",
      );
    }
  }, []);

  const writeRaw = useCallback(
    async function writeRaw(raw: string): Promise<void> {
      await AsyncStorage.setItem(STAGE_PREFERENCE_KEY, raw);
      await reload();
    },
    [reload],
  );

  const reset = useCallback(
    async function reset(): Promise<void> {
      await clearStagePreference(AsyncStorage);
      await reload();
    },
    [reload],
  );

  return {
    ...hydration,
    loading,
    error,
    select,
    writeRaw,
    reset,
    reload,
  };
}
