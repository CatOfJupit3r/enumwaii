import { createFileRoute } from "@tanstack/solid-router";
import { For, createSignal, useTransition } from "solid-js";

import { parseIncidentStateInspection } from "~/domain/incident-inspection";
import {
  INCIDENT_STATE,
  describeIncidentState,
  listIncidentStates,
} from "~/domain/incidents";
import { inspectIncidentState } from "~/server/incidents.functions";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [{ title: "Boundary lab · Northstar" }],
  }),
  component: ValidationLabPage,
});

interface ProbeResult {
  readonly accepted: boolean;
  readonly title: string;
  readonly detail: string;
}

function ValidationLabPage() {
  const [candidate, setCandidate] = createSignal<string>(
    INCIDENT_STATE.MITIGATING,
  );
  const [result, setResult] = createSignal<ProbeResult>();
  const [isPending, startTransition] = useTransition();

  function probeServer(): void {
    setResult(undefined);
    void startTransition(async () => {
      try {
        const inspected = await inspectIncidentState({ data: candidate() });
        const state = parseIncidentStateInspection(inspected);
        const presentation = describeIncidentState(state);
        setResult({
          accepted: true,
          title: `${presentation.label} / ${inspected.state} accepted`,
          detail: `${inspected.summary} Validated on the server at ${formatTime(inspected.validatedAt)}.`,
        });
      } catch (error) {
        setResult({
          accepted: false,
          title: `${candidate() || "Empty input"} rejected`,
          detail: errorMessage(error),
        });
      }
    });
  }

  return (
    <main class="lab-page page-frame">
      <section class="lab-hero">
        <p class="eyebrow">Boundary lab / Strict mode</p>
        <h1>Nothing crosses on resemblance alone.</h1>
        <p>
          This form calls a GET server function whose scalar validator is the
          enumwaii declaration itself — Standard Schema, no wrapper. The wire
          response is plain data and is re-parsed before domain use.
        </p>
      </section>

      <div class="lab-grid">
        <section class="probe-panel">
          <div class="probe-panel__header">
            <span class="mono">SERVER_FN / INSPECT</span>
            <span class="strict-badge">STRICT REJECTION</span>
          </div>

          <label for="state-candidate">External state candidate</label>
          <div class="probe-input-row">
            <input
              autocomplete="off"
              id="state-candidate"
              onInput={(event) => setCandidate(event.currentTarget.value)}
              spellcheck={false}
              value={candidate()}
            />
            <button disabled={isPending()} onClick={probeServer} type="button">
              {isPending() ? "Inspecting…" : "Send to server"}
            </button>
          </div>

          <div class="probe-chips" aria-label="Candidate examples">
            <For each={listIncidentStates()}>
              {(state) => (
                <button onClick={() => setCandidate(state)} type="button">
                  {state}
                </button>
              )}
            </For>
            <button
              class="probe-chip--invalid"
              onClick={() => setCandidate("PAUSED")}
              type="button"
            >
              PAUSED ×
            </button>
          </div>

          <div class="probe-result" data-accepted={result()?.accepted}>
            {result() ? (
              <>
                <span class="probe-result__signal" aria-hidden="true" />
                <div aria-live="polite">
                  <strong>{result()?.title}</strong>
                  <p>{result()?.detail}</p>
                </div>
              </>
            ) : (
              <p>Choose any candidate, then send it across the server seam.</p>
            )}
          </div>
        </section>

        <aside class="policy-stack">
          <article class="policy-card">
            <span class="policy-card__number mono">01</span>
            <p class="eyebrow">Nil default</p>
            <h2>Absence is expected</h2>
            <p>
              The control-room URL maps a missing focus to{" "}
              <span class="mono">MITIGATING</span>. A default handles only null
              or undefined; malformed strings still fail without another policy.
            </p>
          </article>
          <article class="policy-card policy-card--amber">
            <span class="policy-card__number mono">02</span>
            <p class="eyebrow">Malformed fallback</p>
            <h2>Recovery is deliberate</h2>
            <p>
              The dashboard recovers an unknown URL member to{" "}
              <span class="mono">TRIAGE</span> and labels that decision as a
              fallback so it never masquerades as valid input.
            </p>
          </article>
          <article class="policy-card policy-card--red">
            <span class="policy-card__number mono">03</span>
            <p class="eyebrow">Strict server seam</p>
            <h2>Mutations reject ambiguity</h2>
            <p>
              Scalar inspection rejects malformed input. Transition objects use
              Zod with enumwaii&apos;s official Zod adapter before touching the
              incident store.
            </p>
          </article>
        </aside>
      </div>
    </main>
  );
}

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Standard Schema rejected this candidate.";
}
