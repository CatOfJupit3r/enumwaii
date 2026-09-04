import { NOTICE_TONE, type NoticeTone } from "~/domain/presentation";
import { createForm } from "@tanstack/solid-form";
import { For, Show, createSignal } from "solid-js";
import { z } from "zod";

import {
  createIncidentInputSchema,
  incidentStateSchema,
  listIncidentStates,
  type IncidentRecord,
} from "~/domain/incidents";
import { createIncident } from "~/server/incidents.functions";

export interface IncidentIntakeFormProps {
  readonly onCreated: (incident: IncidentRecord) => void;
}

interface IncidentDraft {
  service: string;
  title: string;
  owner: string;
  impact: string;
  state: unknown;
}

interface SubmissionNotice {
  readonly tone: NoticeTone;
  readonly message: string;
}

const requiredText = z.string().trim().min(1, "Required");
const defaultIncidentDraft: IncidentDraft = {
  service: "",
  title: "",
  owner: "",
  impact: "",
  state: "",
};

export function IncidentIntakeForm(props: IncidentIntakeFormProps) {
  const [notice, setNotice] = createSignal<SubmissionNotice>();
  const form = createForm(() => ({
    defaultValues: defaultIncidentDraft,
    onSubmit: async ({ value }) => {
      try {
        const created = await createIncident({
          data: createIncidentInputSchema.parse(value),
        });
        props.onCreated(created);
        form.reset();
        setNotice({
          tone: NOTICE_TONE.SUCCESS,
          message: `${created.id} added to the live incident board.`,
        });
      } catch (error) {
        setNotice({ tone: NOTICE_TONE.ERROR, message: errorMessage(error) });
      }
    },
    onSubmitInvalid: () => {
      setNotice({
        tone: NOTICE_TONE.ERROR,
        message: "Complete the required fields before opening the incident.",
      });
    },
  }));

  return (
    <section class="intake-panel" aria-labelledby="incident-intake-title">
      <div class="intake-panel__header">
        <div>
          <p class="eyebrow">New signal / Server mutation</p>
          <h2 id="incident-intake-title">Open an incident</h2>
        </div>
        <span class="intake-panel__badge mono">POST / VALIDATED</span>
      </div>
      <p class="intake-panel__intro">
        Capture the first operational signal. The state selector remains raw at
        the DOM edge and is parsed into an owned member before storage.
      </p>

      <form
        class="intake-form"
        id={form.formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div class="intake-form__grid">
          <form.Field
            name="service"
            validators={{
              onBlur: requiredText,
              onChange: requiredText,
              onSubmit: requiredText,
            }}
          >
            {(field) => (
              <div class="intake-field">
                <label for="incident-service">
                  Service <span class="intake-field__required">Required</span>
                </label>
                <input
                  autocomplete="off"
                  id="incident-service"
                  name="service"
                  onBlur={field().handleBlur}
                  onInput={(event) =>
                    field().handleChange(event.currentTarget.value)
                  }
                  placeholder="Checkout API"
                  aria-describedby="incident-service-error"
                  aria-invalid={fieldHasError(field().state.meta.errors)}
                  value={textValue(field().state.value)}
                />
                <FieldError
                  fieldId="incident-service"
                  errors={field().state.meta.errors}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="title"
            validators={{
              onBlur: requiredText,
              onChange: requiredText,
              onSubmit: requiredText,
            }}
          >
            {(field) => (
              <div class="intake-field">
                <label for="incident-title">
                  Signal title{" "}
                  <span class="intake-field__required">Required</span>
                </label>
                <input
                  autocomplete="off"
                  id="incident-title"
                  name="title"
                  onBlur={field().handleBlur}
                  onInput={(event) =>
                    field().handleChange(event.currentTarget.value)
                  }
                  placeholder="Elevated payment retries"
                  aria-describedby="incident-title-error"
                  aria-invalid={fieldHasError(field().state.meta.errors)}
                  value={textValue(field().state.value)}
                />
                <FieldError
                  fieldId="incident-title"
                  errors={field().state.meta.errors}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="owner"
            validators={{
              onBlur: requiredText,
              onChange: requiredText,
              onSubmit: requiredText,
            }}
          >
            {(field) => (
              <div class="intake-field">
                <label for="incident-owner">
                  Commander <span class="intake-field__required">Required</span>
                </label>
                <input
                  autocomplete="off"
                  id="incident-owner"
                  name="owner"
                  onBlur={field().handleBlur}
                  onInput={(event) =>
                    field().handleChange(event.currentTarget.value)
                  }
                  placeholder="Mira Chen"
                  aria-describedby="incident-owner-error"
                  aria-invalid={fieldHasError(field().state.meta.errors)}
                  value={textValue(field().state.value)}
                />
                <FieldError
                  fieldId="incident-owner"
                  errors={field().state.meta.errors}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="impact"
            validators={{
              onBlur: requiredText,
              onChange: requiredText,
              onSubmit: requiredText,
            }}
          >
            {(field) => (
              <div class="intake-field">
                <label for="incident-impact">
                  Customer impact{" "}
                  <span class="intake-field__required">Required</span>
                </label>
                <input
                  autocomplete="off"
                  id="incident-impact"
                  name="impact"
                  onBlur={field().handleBlur}
                  onInput={(event) =>
                    field().handleChange(event.currentTarget.value)
                  }
                  placeholder="4.8% of checkout attempts"
                  aria-describedby="incident-impact-error"
                  aria-invalid={fieldHasError(field().state.meta.errors)}
                  value={textValue(field().state.value)}
                />
                <FieldError
                  fieldId="incident-impact"
                  errors={field().state.meta.errors}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="state"
            validators={{
              onBlur: incidentStateSchema,
              onChange: incidentStateSchema,
              onSubmit: incidentStateSchema,
            }}
          >
            {(field) => (
              <div class="intake-field">
                <label for="incident-state">
                  Initial state{" "}
                  <span class="intake-field__required">Required</span>
                </label>
                <select
                  id="incident-state"
                  name="state"
                  onBlur={field().handleBlur}
                  aria-describedby="incident-state-error"
                  aria-invalid={fieldHasError(field().state.meta.errors)}
                  onChange={(event) =>
                    field().handleChange(event.currentTarget.value)
                  }
                  value={textValue(field().state.value)}
                >
                  <option disabled value="">
                    Choose a response state
                  </option>
                  <For each={listIncidentStates()}>
                    {(state) => <option value={state}>{state}</option>}
                  </For>
                </select>
                <FieldError
                  fieldId="incident-state"
                  errors={field().state.meta.errors}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div class="intake-form__footer">
          <div
            class="intake-form__status"
            aria-live="polite"
            data-tone={notice()?.tone}
          >
            <Show
              when={notice()}
              fallback={<span>New records start at version 0.</span>}
            >
              {(currentNotice) => <span>{currentNotice().message}</span>}
            </Show>
          </div>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <button
                class="intake-submit"
                disabled={isSubmitting()}
                type="submit"
              >
                {isSubmitting() ? "Opening signal…" : "Open incident"}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </section>
  );
}

interface FieldErrorProps {
  readonly errors: readonly unknown[];
  readonly fieldId: string;
}

function FieldError(props: FieldErrorProps) {
  return (
    <p
      class="intake-field__error"
      id={`${props.fieldId}-error`}
      role={fieldHasError(props.errors) ? "alert" : undefined}
    >
      {fieldHasError(props.errors) ? errorText(props.errors[0]) : ""}
    </p>
  );
}

function fieldHasError(errors: readonly unknown[]): boolean {
  return errors.length > 0;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (Array.isArray(error)) {
    const first = error[0];
    return first === undefined ? "This field is invalid." : errorText(first);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
  }
  return "This field is invalid.";
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The incident could not be opened.";
}
