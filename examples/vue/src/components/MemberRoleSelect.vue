<script setup lang="ts">
import {
  ACCESS_LEVEL_VALUES,
  ACCESS_POLICY,
  describeAccessLevel,
  parseAccessLevel,
  type AccessLevel,
} from "../domain/access-control";

const props = defineProps<{
  readonly memberId: string;
  readonly level: AccessLevel;
}>();

const emit = defineEmits<{
  update: [memberId: string, level: AccessLevel];
}>();

function updateRole(event: Event): void {
  if (!(event.currentTarget instanceof HTMLSelectElement)) return;
  const result = parseAccessLevel(
    event.currentTarget.value,
    ACCESS_POLICY.STRICT,
  );
  if (result.success) emit("update", props.memberId, result.value);
}
</script>

<template>
  <select
    :aria-label="`Role for ${memberId}`"
    class="member-role-select"
    :value="level"
    @change="updateRole"
  >
    <option v-for="role in ACCESS_LEVEL_VALUES" :key="role" :value="role">
      {{ describeAccessLevel(role).label }}
    </option>
  </select>
</template>
