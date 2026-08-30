import { computed, ref, watch, type ComputedRef, type Ref } from "vue";

import {
  ACCESS_POLICY,
  ACCESS_LEVELS,
  type AccessLevel,
  type AccessLevelParseResult,
  parseAccessLevel,
  type AccessPolicy,
} from "../domain/access-control";

const QUERY_KEY = "level";
const STORAGE_KEY = "enumwaii-console-level";

export type PersistenceSource = "url" | "localStorage" | "default" | "external";
export type PersistenceOutcome = "accepted" | "rejected";

export interface AccessLevelPersistenceOptions {
  readonly policy?: AccessPolicy;
  readonly initial?: AccessLevel;
}

export interface AccessLevelPersistence {
  readonly level: Ref<AccessLevel>;
  readonly policy: Ref<AccessPolicy>;
  readonly rawInput: Ref<unknown>;
  readonly source: Ref<PersistenceSource>;
  readonly outcome: Ref<PersistenceOutcome>;
  readonly errorMessage: Ref<string | null>;
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
    return { raw: undefined, source: "default" };
  }

  const urlValue = new URL(window.location.href).searchParams.get(QUERY_KEY);
  if (urlValue !== null) return { raw: urlValue, source: "url" };

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (storedValue !== null) {
    return { raw: storedValue, source: "localStorage" };
  }
  return { raw: undefined, source: "default" };
}

function persistLevel(level: AccessLevel): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, level);
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_KEY, level);
  window.history.replaceState({}, "", url);
}

function removePersistedLevel(): void {
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
  const policy = ref<AccessPolicy>(options.policy ?? ACCESS_POLICY.NIL_DEFAULT);
  const rawInput = ref<unknown>(undefined);
  const source = ref<PersistenceSource>("default");
  const outcome = ref<PersistenceOutcome>("accepted");
  const errorMessage = ref<string | null>(null);
  const serializedLevel = computed(() => level.value);
  let loading = false;

  function applyResult(
    input: unknown,
    inputSource: PersistenceSource,
  ): AccessLevelParseResult {
    rawInput.value = input;
    source.value = inputSource;
    const result = parseAccessLevel(input, policy.value);
    if (result.success) {
      level.value = result.value;
      outcome.value = "accepted";
      errorMessage.value = null;
    } else {
      outcome.value = "rejected";
      errorMessage.value = result.error.message;
    }
    return result;
  }

  function load(): AccessLevelParseResult {
    const persisted = readPersistedInput();
    loading = true;
    const result = applyResult(persisted.raw, persisted.source);
    loading = false;
    return result;
  }

  function setFromExternal(input: unknown): AccessLevelParseResult {
    return applyResult(input, "external");
  }

  function clearPersistence(): void {
    removePersistedLevel();
    load();
  }

  watch(level, (next, previous) => {
    if (!loading && next !== previous) persistLevel(next);
  });
  watch(policy, () => {
    load();
  });

  load();

  return {
    level,
    policy,
    rawInput,
    source,
    outcome,
    errorMessage,
    serializedLevel,
    load,
    setFromExternal,
    clearPersistence,
  };
}
