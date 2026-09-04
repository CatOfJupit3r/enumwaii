import { em, type InferEnumwaii } from "enumwaii";
import { computed, ref, watch, type ComputedRef, type Ref } from "vue";

import {
  ACCESS_LEVELS,
  ACCESS_POLICY,
  describeAccessLevel,
  parseAccessLevel,
  type AccessLevel,
  type AccessLevelParseResult,
} from "../domain/access-control";

const persistenceOutcomes = em([
  "ACCEPTED",
  "DEFAULTED",
  "FALLBACK",
  "RESET",
  "REJECTED",
]);
export const PERSISTENCE_OUTCOME = persistenceOutcomes.enum;
export type PersistenceOutcome = InferEnumwaii<typeof persistenceOutcomes>;

const persistenceSources = em(["URL", "LOCAL_STORAGE", "DEFAULT", "EXTERNAL"]);
export const PERSISTENCE_SOURCE = persistenceSources.enum;
export type PersistenceSource = InferEnumwaii<typeof persistenceSources>;

const QUERY_KEY = "as";
const STORAGE_KEY = "crewboard-view-as";

export interface AccessLevelPersistenceOptions {
  readonly initial?: AccessLevel;
}

export interface AccessLevelPersistence {
  readonly level: Ref<AccessLevel>;
  readonly rawInput: Ref<unknown>;
  readonly source: Ref<PersistenceSource>;
  readonly outcome: Ref<PersistenceOutcome>;
  readonly message: Ref<string | null>;
  readonly serializedLevel: ComputedRef<AccessLevel>;
  readonly load: () => AccessLevelParseResult;
  readonly setFromExternal: (input: unknown) => AccessLevelParseResult;
  readonly clearPersistence: () => void;
}

interface PersistedInput {
  readonly raw: unknown;
  readonly source: PersistenceSource;
}

function readPersistedInput(): PersistedInput {
  if (typeof window === "undefined") {
    return { raw: undefined, source: PERSISTENCE_SOURCE.DEFAULT };
  }

  const urlValue = new URL(window.location.href).searchParams.get(QUERY_KEY);
  if (urlValue !== null)
    return { raw: urlValue, source: PERSISTENCE_SOURCE.URL };

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (storedValue !== null) {
    return { raw: storedValue, source: PERSISTENCE_SOURCE.LOCAL_STORAGE };
  }
  return { raw: undefined, source: PERSISTENCE_SOURCE.DEFAULT };
}

function persistLevel(level: AccessLevel): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, level);
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_KEY, level);
  window.history.replaceState({}, "", url);
}

function removePersistence(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
  const url = new URL(window.location.href);
  url.searchParams.delete(QUERY_KEY);
  window.history.replaceState({}, "", url);
}

export function useAccessLevelPersistence(
  options: AccessLevelPersistenceOptions = {},
): AccessLevelPersistence {
  const level = ref<AccessLevel>(options.initial ?? ACCESS_LEVELS.VIEWER);
  const rawInput = ref<unknown>(undefined);
  const source = ref<PersistenceSource>(PERSISTENCE_SOURCE.DEFAULT);
  const outcome = ref<PersistenceOutcome>(PERSISTENCE_OUTCOME.DEFAULTED);
  const message = ref<string | null>(null);
  const serializedLevel = computed(() => level.value);
  let loading = false;

  function accept(
    result: AccessLevelParseResult,
    nextOutcome: PersistenceOutcome,
    nextMessage: string | null,
  ): AccessLevelParseResult {
    if (result.success) level.value = result.value;
    outcome.value = nextOutcome;
    message.value = nextMessage;
    return result;
  }

  function load(): AccessLevelParseResult {
    const persisted = readPersistedInput();
    rawInput.value = persisted.raw;
    source.value = persisted.source;
    loading = true;

    let result: AccessLevelParseResult;
    if (persisted.source === PERSISTENCE_SOURCE.DEFAULT) {
      result = accept(
        parseAccessLevel(persisted.raw, ACCESS_POLICY.NIL_DEFAULT),
        PERSISTENCE_OUTCOME.DEFAULTED,
        null,
      );
    } else {
      const strict = parseAccessLevel(persisted.raw, ACCESS_POLICY.STRICT);
      if (strict.success) {
        result = accept(strict, PERSISTENCE_OUTCOME.ACCEPTED, null);
      } else if (persisted.source === PERSISTENCE_SOURCE.URL) {
        result = accept(
          parseAccessLevel(persisted.raw, ACCESS_POLICY.FALLBACK),
          PERSISTENCE_OUTCOME.FALLBACK,
          `Unknown role ${strict.error.receivedText}; showing as ${describeAccessLevel(ACCESS_LEVELS.VIEWER).label}.`,
        );
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        result = accept(
          parseAccessLevel(undefined, ACCESS_POLICY.NIL_DEFAULT),
          PERSISTENCE_OUTCOME.RESET,
          "The saved viewing role was corrupt, so Crewboard reset it.",
        );
      }
    }

    loading = false;
    return result;
  }

  function setFromExternal(input: unknown): AccessLevelParseResult {
    rawInput.value = input;
    source.value = PERSISTENCE_SOURCE.EXTERNAL;
    const result = parseAccessLevel(input, ACCESS_POLICY.STRICT);
    return accept(
      result,
      result.success
        ? PERSISTENCE_OUTCOME.ACCEPTED
        : PERSISTENCE_OUTCOME.REJECTED,
      result.success ? null : result.error.message,
    );
  }

  function clearPersistence(): void {
    removePersistence();
    load();
  }

  watch(
    level,
    (next, previous) => {
      if (!loading && next !== previous) persistLevel(next);
    },
    { flush: "sync" },
  );

  load();

  return {
    level,
    rawInput,
    source,
    outcome,
    message,
    serializedLevel,
    load,
    setFromExternal,
    clearPersistence,
  };
}
