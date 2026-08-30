import { Link, createFileRoute } from "@tanstack/solid-router";
import { For, createMemo, createSignal, useTransition } from "solid-js";

import { IncidentCard } from "~/components/incident-card";
import { StateTrack } from "~/components/state-track";
import { controlRoomSearchSchema } from "~/domain/control-room-search";
import {
  INCIDENT_STATE,
  countIncidentsInState,
  describeIncidentState,
  type IncidentRecord,
  type IncidentState,
} from "~/domain/incidents";
import {
  getIncidentBoard,
  transitionIncident,
} from "~/server/incidents.functions";

export const Route = createFileRoute("/")({
  validateSearch: controlRoomSearchSchema,
  loaderDeps: ({ search }) => ({ focus: search.focus }),
  loader: async ({ deps }) => {
    const board = await getIncidentBoard();
    return { ...board, initialFocus: deps.focus };
  },
  head: () => ({
    meta: [{ title: "Control room · Northstar" }],
  }),
  component: ControlRoomPage,
});

interface Notice {
  readonly tone: "success" | "error";
  readonly message: string;
}

function ControlRoomPage() {
  const board = Route.useLoaderData();
  const search = Route.useSearch();
  const [incidents, setIncidents] = createSignal(board().incidents);
  const [notice, setNotice] = createSignal<Notice>();
  const [isPending, startTransition] = useTransition();
  const focusedPresentation = createMemo(() =>
    describeIncidentState(search().focus),
  );
  const activeCount = createMemo(
    () =>
      incidents().length -
      countIncidentsInState(incidents(), INCIDENT_STATE.RESOLVED),
  );
  const releaseAssessment = createMemo(() => assessRelease(incidents()));

  function requestTransition(
    incident: IncidentRecord,
    to: IncidentState,
  ): void {
    setNotice(undefined);
    void startTransition(async () => {
      try {
        const updated = await transitionIncident({
          data: {
            incidentId: incident.id,
            to,
            expectedVersion: incident.version,
          },
        });
        setIncidents((current) =>
          current.map((candidate) =>
            candidate.id === updated.id ? updated : candidate,
          ),
        );
        setNotice({
          tone: "success",
          message: `${updated.id} moved to ${describeIncidentState(updated.state).label}.`,
        });
      } catch (error) {
        setNotice({ tone: "error", message: errorMessage(error) });
      }
    });
  }

  return (
    <main>
      <section class="control-hero page-frame">
        <div class="hero-copy">
          <p class="eyebrow">Release {board().release} / Live command</p>
          <h1>
            Ship with a clear
            <span> operational signal.</span>
          </h1>
          <p class="hero-summary">
            A server-rendered incident board where every external state crosses
            an explicit validation boundary before it reaches the UI.
          </p>
        </div>

        <div class="release-dial" data-gate={releaseAssessment().tone}>
          <div class="release-dial__orbit" aria-hidden="true">
            <span />
          </div>
          <div class="release-dial__copy">
            <small>Release gate</small>
            <strong>{releaseAssessment().label}</strong>
            <span>{releaseAssessment().detail}</span>
          </div>
        </div>
      </section>

      <section class="metrics-bar">
        <div class="page-frame metrics-bar__inner">
          <div class="metric">
            <span class="metric__value">{activeCount()}</span>
            <span>Active incidents</span>
          </div>
          <div class="metric">
            <span class="metric__value">99.94%</span>
            <span>Edge availability</span>
          </div>
          <div class="metric">
            <span class="metric__value">7m 12s</span>
            <span>Median mitigation</span>
          </div>
          <div class="metric metric--timestamp">
            <span class="mono">SSR {formatTime(board().loadedAt)}</span>
            <span>Loader snapshot</span>
          </div>
        </div>
      </section>

      <div class="page-frame workspace-grid">
        <section class="workspace-main" aria-labelledby="active-incidents">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Operational queue</p>
              <h2 id="active-incidents">Incident board</h2>
            </div>
            <span class="queue-count mono">{incidents().length} RECORDS</span>
          </div>

          <div class="boundary-panel">
            <div class="boundary-panel__copy">
              <span class="boundary-panel__icon" aria-hidden="true">
                ↳
              </span>
              <div>
                <strong>URL boundary policy</strong>
                <p>
                  <span class="mono">{search().received ?? "∅ missing"}</span>{" "}
                  resolved by <b>{search().resolution}</b> to{" "}
                  <span class="mono">{search().focus}</span>.
                </p>
              </div>
            </div>
            <div class="boundary-actions" aria-label="Search boundary examples">
              <Link class="boundary-link" search={{}} to="/">
                Nil default
              </Link>
              <Link
                class="boundary-link"
                search={{ focus: INCIDENT_STATE.MONITORING }}
                to="/"
              >
                Valid member
              </Link>
              <a class="boundary-link" href="/?focus=PAUSED">
                Malformed fallback
              </a>
            </div>
          </div>

          <div class="focus-caption">
            <span class="focus-caption__beam" aria-hidden="true" />
            Highlighting <strong>{focusedPresentation().label}</strong> records
          </div>

          <div class="incident-list" aria-busy={isPending()}>
            <For each={incidents()}>
              {(incident) => (
                <IncidentCard
                  busy={isPending()}
                  focused={incident.state === search().focus}
                  incident={incident}
                  onTransition={requestTransition}
                />
              )}
            </For>
          </div>

          <div class="notice-region" aria-live="polite">
            {notice() ? (
              <p class="notice" data-tone={notice()?.tone}>
                {notice()?.message}
              </p>
            ) : null}
          </div>
        </section>

        <aside class="workspace-aside">
          <section class="aside-panel">
            <div class="aside-panel__heading">
              <p class="eyebrow">Lifecycle map</p>
              <span class="mono">EXHAUSTIVE</span>
            </div>
            <h2>Response states</h2>
            <p class="aside-intro">
              Presentation and allowed moves are derived from the same owned
              incident members.
            </p>
            <StateTrack focusedState={search().focus} incidents={incidents()} />
          </section>

          <section class="aside-panel boundary-callout">
            <span class="boundary-callout__index mono">02</span>
            <p class="eyebrow">Strict seam</p>
            <h2>Probe server validation</h2>
            <p>
              Send valid and malformed scalar states through the real server
              function validator.
            </p>
            <Link class="primary-link" to="/validation">
              Open boundary lab <span aria-hidden="true">↗</span>
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function assessRelease(incidents: readonly IncidentRecord[]): {
  readonly label: string;
  readonly detail: string;
  readonly tone: "hold" | "watch" | "clear";
} {
  if (countIncidentsInState(incidents, INCIDENT_STATE.TRIAGE) > 0) {
    return { label: "Hold", detail: "Unscoped incident", tone: "hold" };
  }
  if (countIncidentsInState(incidents, INCIDENT_STATE.MITIGATING) > 0) {
    return { label: "Hold", detail: "Mitigation in flight", tone: "hold" };
  }
  if (countIncidentsInState(incidents, INCIDENT_STATE.MONITORING) > 0) {
    return { label: "Watch", detail: "Observation window", tone: "watch" };
  }
  return { label: "Clear", detail: "All signals nominal", tone: "clear" };
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
    : "The transition was rejected.";
}
