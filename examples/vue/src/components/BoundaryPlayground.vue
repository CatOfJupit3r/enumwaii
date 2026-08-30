<script setup lang="ts">
import { computed, ref } from "vue";

import {
  ACCESS_POLICY,
  ACCESS_POLICY_VALUES,
  describeAccessLevel,
  parseAccessLevel,
  policyDescription,
  policyLabel,
  type AccessLevel,
  type AccessLevelParseResult,
  type AccessPolicy,
} from "../domain/access-control";

type PresetId = "valid" | "missing" | "malformed" | "wrong-shaped" | "custom";

interface Preset {
  readonly label: string;
  readonly hint: string;
  readonly raw: unknown;
}

const presets: Readonly<Record<Exclude<PresetId, "custom">, Preset>> = {
  valid: { label: "Valid member", hint: '"EDITOR"', raw: "EDITOR" },
  missing: { label: "Missing value", hint: "null", raw: null },
  malformed: { label: "Unknown string", hint: '"ARCHIVED"', raw: "ARCHIVED" },
  "wrong-shaped": {
    label: "Wrong shape",
    hint: '{ level: "EDITOR" }',
    raw: { level: "EDITOR" },
  },
};

const selectedPreset = ref<PresetId>("valid");
const customInput = ref("EDITOR");
const activePolicy = ref<AccessPolicy>(ACCESS_POLICY.NIL_DEFAULT);

const props = defineProps<{
  readonly activeLevel: AccessLevel;
}>();

const emit = defineEmits<{
  apply: [level: AccessLevel];
}>();

const rawInput = computed<unknown>(() => {
  if (selectedPreset.value === "custom") return customInput.value;
  return presets[selectedPreset.value].raw;
});

const rawLabel = computed(() => {
  const result = parseAccessLevel(rawInput.value, ACCESS_POLICY.STRICT);
  return result.success
    ? JSON.stringify(result.value)
    : result.error.receivedText;
});

const results = computed(() =>
  ACCESS_POLICY_VALUES.map((policy) => ({
    policy,
    result: parseAccessLevel(rawInput.value, policy),
  })),
);

const activeResult = computed(() =>
  parseAccessLevel(rawInput.value, activePolicy.value),
);

function resultTitle(result: AccessLevelParseResult): string {
  return result.success ? describeAccessLevel(result.value).label : "Rejected";
}

function resultDetail(result: AccessLevelParseResult): string {
  return result.success ? "Branded value enters state" : "EnumwaiiParseError";
}

function applySelection(): void {
  if (activeResult.value.success) emit("apply", activeResult.value.value);
}
</script>

<template>
  <section class="panel boundary-panel" aria-labelledby="boundary-heading">
    <div class="panel__header">
      <div>
        <p class="section-kicker">Boundary lab</p>
        <h2 id="boundary-heading">Put persistence under a microscope</h2>
      </div>
      <span class="boundary-panel__badge">unknown → branded</span>
    </div>

    <p class="panel__intro">
      Pick the exact payload a URL or storage adapter might return. Each policy
      is evaluated independently, so a fallback never disguises a nil-only
      default.
    </p>

    <div class="boundary-controls">
      <div class="preset-picker" role="group" aria-label="Persistence fixtures">
        <button
          v-for="(preset, id) in presets"
          :key="id"
          class="fixture-button"
          :class="{ 'fixture-button--active': selectedPreset === id }"
          type="button"
          @click="selectedPreset = id"
        >
          <span>{{ preset.label }}</span>
          <small>{{ preset.hint }}</small>
        </button>
        <button
          class="fixture-button"
          :class="{ 'fixture-button--active': selectedPreset === 'custom' }"
          type="button"
          @click="selectedPreset = 'custom'"
        >
          <span>Custom text</span>
          <small>type anything</small>
        </button>
      </div>

      <label v-if="selectedPreset === 'custom'" class="custom-input">
        <span>Raw string from outside the app</span>
        <input v-model="customInput" type="text" autocomplete="off" />
      </label>
    </div>

    <div class="payload-readout">
      <span class="payload-readout__label">Selected unknown payload</span>
      <code>{{ rawLabel }}</code>
    </div>

    <div class="policy-grid" aria-live="polite">
      <article
        v-for="entry in results"
        :key="entry.policy"
        class="policy-card"
        :class="{ 'policy-card--active': entry.policy === activePolicy }"
      >
        <div class="policy-card__topline">
          <button
            class="policy-card__name"
            type="button"
            @click="activePolicy = entry.policy"
          >
            {{ policyLabel(entry.policy) }}
          </button>
          <span
            class="result-pill"
            :class="
              entry.result.success
                ? 'result-pill--accepted'
                : 'result-pill--rejected'
            "
          >
            {{ entry.result.success ? "Accepted" : "Rejected" }}
          </span>
        </div>
        <p class="policy-card__description">
          {{ policyDescription(entry.policy) }}
        </p>
        <div class="policy-card__result">
          <strong>{{ resultTitle(entry.result) }}</strong>
          <span>{{ resultDetail(entry.result) }}</span>
        </div>
      </article>
    </div>

    <div class="boundary-apply">
      <div>
        <span class="boundary-apply__label"
          >Active policy: {{ policyLabel(activePolicy) }}</span
        >
        <span class="boundary-apply__detail">
          {{
            activeResult.success
              ? `Apply ${describeAccessLevel(activeResult.value).label} to the console`
              : "Rejected payload stays outside state"
          }}
        </span>
      </div>
      <button
        class="button button--primary"
        type="button"
        :disabled="!activeResult.success"
        @click="applySelection"
      >
        Apply to console
        <span aria-hidden="true">→</span>
      </button>
    </div>

    <p class="boundary-panel__footnote">
      Current console level:
      <strong>{{ describeAccessLevel(props.activeLevel).label }}</strong
      >. Applying only emits the branded result from the selected policy.
    </p>
  </section>
</template>
