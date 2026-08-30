<script setup lang="ts">
import {
  describePermission,
  type AccessLevel,
  type AccessLevelMetadata,
  type Permission,
} from "../domain/access-control";

const props = defineProps<{
  readonly level: AccessLevel;
  readonly metadata: AccessLevelMetadata;
  readonly permissions: readonly Permission[];
  readonly selected: boolean;
}>();

const emit = defineEmits<{
  select: [level: AccessLevel];
}>();

function selectLevel(): void {
  emit("select", props.level);
}
</script>

<template>
  <button
    class="level-card"
    :class="[
      `level-card--${metadata.accent}`,
      { 'level-card--selected': selected },
    ]"
    type="button"
    :aria-pressed="selected"
    @click="selectLevel"
  >
    <span class="level-card__topline">
      <span class="level-card__dot" aria-hidden="true" />
      <span>{{ metadata.eyebrow }}</span>
      <span v-if="selected" class="level-card__selected">Active</span>
    </span>
    <span class="level-card__title">{{ metadata.label }}</span>
    <span class="level-card__description">{{ metadata.description }}</span>
    <span class="level-card__footer">
      <span
        >{{ permissions.length }}
        {{ permissions.length === 1 ? "permission" : "permissions" }}</span
      >
      <span class="level-card__arrow" aria-hidden="true">↗</span>
    </span>
    <span class="sr-only">
      Permissions:
      {{
        permissions
          .map((permission) => describePermission(permission).label)
          .join(", ")
      }}
    </span>
  </button>
</template>
