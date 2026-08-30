<script setup lang="ts">
import { ref } from "vue";

import {
  ACCESS_LEVEL_VALUES,
  describeAccessLevel,
  parseAccessLevel,
  type AccessInvitation,
} from "../domain/access-control";

interface FormErrors {
  readonly email?: string;
  readonly level?: string;
}

const emit = defineEmits<{
  created: [invitation: AccessInvitation];
}>();

const email = ref("");
const emailControl = ref<HTMLInputElement | null>(null);
const rawLevel = ref("");
const note = ref("");
const errors = ref<FormErrors>({});
const successMessage = ref("");

function validateEmail(): string | undefined {
  if (email.value.trim().length === 0) {
    return "Enter a teammate email address.";
  }
  if (emailControl.value?.validity.typeMismatch === true) {
    return "Enter a valid email address.";
  }
  return undefined;
}

function submitInvitation(): void {
  successMessage.value = "";

  const emailError = validateEmail();
  const levelResult = parseAccessLevel(rawLevel.value, "strict");
  const levelError = levelResult.success
    ? undefined
    : "Choose one of the owned access levels.";

  errors.value = { email: emailError, level: levelError };
  if (emailError !== undefined || !levelResult.success) return;

  const invitation: AccessInvitation = {
    email: email.value.trim(),
    level: levelResult.value,
    note: note.value.trim(),
  };
  emit("created", invitation);

  successMessage.value = `${invitation.email} is ready for ${describeAccessLevel(invitation.level).label} access.`;
  email.value = "";
  rawLevel.value = "";
  note.value = "";
  errors.value = {};
}
</script>

<template>
  <form
    class="access-request-form"
    novalidate
    @submit.prevent="submitInvitation"
  >
    <div class="form-heading">
      <div>
        <span class="form-heading__index">Native Vue form</span>
        <h3>Invite a teammate</h3>
      </div>
      <span class="form-heading__status">No form library</span>
    </div>

    <p class="form-intro">
      Draft values stay plain strings. Only a successful strict parse emits an
      owned <code>AccessLevel</code> to the parent.
    </p>

    <div class="form-field-grid">
      <label class="form-field">
        <span>Email address</span>
        <input
          ref="emailControl"
          v-model="email"
          aria-describedby="email-hint email-error"
          :aria-invalid="errors.email !== undefined"
          autocomplete="email"
          name="email"
          placeholder="alex@studio.dev"
          required
          type="email"
        />
        <small id="email-hint">The invite is scoped to this workspace.</small>
        <strong v-if="errors.email" id="email-error" class="form-error">
          {{ errors.email }}
        </strong>
      </label>

      <label class="form-field">
        <span>Access level</span>
        <select
          v-model="rawLevel"
          aria-describedby="level-hint level-error"
          :aria-invalid="errors.level !== undefined"
          name="level"
          required
        >
          <option disabled value="">Choose a level</option>
          <option
            v-for="level in ACCESS_LEVEL_VALUES"
            :key="level"
            :value="level"
          >
            {{ describeAccessLevel(level).label }} ·
            {{ describeAccessLevel(level).eyebrow }}
          </option>
        </select>
        <small id="level-hint">The DOM value is parsed before it leaves.</small>
        <strong v-if="errors.level" id="level-error" class="form-error">
          {{ errors.level }}
        </strong>
      </label>
    </div>

    <label class="form-field">
      <span>Invite note <i>optional</i></span>
      <textarea
        v-model="note"
        maxlength="160"
        name="note"
        placeholder="Add context for the workspace owner…"
        rows="3"
      />
      <small>{{ note.length }}/160 characters</small>
    </label>

    <div class="form-actions">
      <p aria-live="polite" class="form-success">{{ successMessage }}</p>
      <button class="button button--primary" type="submit">
        Queue invitation <span aria-hidden="true">→</span>
      </button>
    </div>
  </form>
</template>
