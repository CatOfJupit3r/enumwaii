import {
  NOTICE_TONE,
  type NoticeTone,
  RELEASE_TONE,
  type ReleaseTone,
} from "~/domain/presentation";
import { Link, createFileRoute } from "@tanstack/solid-router";
import { For, createMemo, createSignal, useTransition } from "solid-js";

import { IncidentCard } from "~/components/incident-card";
import { IncidentIntakeForm } from "~/components/incident-intake-form";
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

export const Route = createFileRoute("/ops")({
  validateSearch: controlRoomSearchSchema,
  loaderDeps: ({ search }) => ({ focus: search.focus }),
  loader: async ({ deps }) => {
    const board = await getIncidentBoard();
    return { ...board, initialFocus: deps.focus };
  },
  head: () => ({
    meta: [{ title: "Ops room · Statuswaii" }],
  }),
  component: OpsRoomPage,
});

interface Notice {
  readonly tone: NoticeTone;
  readonly message: string;
}

function OpsRoomPage() {
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
          tone: NOTICE_TONE.SUCCESS,
          message: `${updated.id} moved to ${describeIncidentState(updated.state).label}.`,
        });
      } catch (error) {
        setNotice({ tone: NOTICE_TONE.ERROR, message: errorMessage(error) });
      }
    });
  }

  function addIncident(incident: IncidentRecord): void {
    setIncidents((current) => [incident, ...current]);
  }

  return (
    <main>
      <section class="control-hero page-frame">
        <div class="hero-copy">
          <p class="eyebrow">Statuswaii / Internal control room</p>
          <h1>
            Coordinate recovery
            <span> without losing state.</span>
          </h1>
          <p class="hero-summary">
            Operate live incidents with optimistic versions, exhaustive
            transitions, and a typed focus link your team can paste into Slack.
          </p>
        </div>

        <div class="release-dial" data-gate={releaseAssessment().tone}>
          <div class="release-dial__orbit" aria-hidden="true">
            <span />
          </div>
          <div class="release-dial__copy">
            <small>Ops posture</small>
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
                <strong>Pasted Slack focus link</strong>
                <p>
                  <span class="mono">
                    {search().received ?? "∅ fresh visit"}
                  </span>{" "}
                  resolved by <b>{search().resolution}</b> to{" "}
                  <span class="mono">{search().focus}</span>.
                </p>
              </div>
            </div>
            <div class="boundary-actions" aria-label="Focus-link examples">
              <Link class="boundary-link" search={{}} to="/ops">
                Fresh visit
              </Link>
              <Link
                class="boundary-link"
                search={{ focus: INCIDENT_STATE.MONITORING }}
                to="/ops"
              >
                Monitoring link
              </Link>
              <a class="boundary-link" href="/ops?focus=PAUSED">
                Typo from Slack
              </a>
            </div>
          </div>

          <IncidentIntakeForm onCreated={addIncident} />

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
            <p class="eyebrow">Serialization bridge</p>
            <h2>Validate on both sides</h2>
            <p>
              Server functions transport honest strings. The client re-parses
              them before restoring branded domain ownership.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function assessRelease(incidents: readonly IncidentRecord[]): {
  readonly label: string;
  readonly detail: string;
  readonly tone: ReleaseTone;
} {
  if (countIncidentsInState(incidents, INCIDENT_STATE.TRIAGE) > 0) {
    return {
      label: "Hold",
      detail: "Unscoped incident",
      tone: RELEASE_TONE.HOLD,
    };
  }
  if (countIncidentsInState(incidents, INCIDENT_STATE.MITIGATING) > 0) {
    return {
      label: "Hold",
      detail: "Mitigation in flight",
      tone: RELEASE_TONE.HOLD,
    };
  }
  if (countIncidentsInState(incidents, INCIDENT_STATE.MONITORING) > 0) {
    return {
      label: "Watch",
      detail: "Observation window",
      tone: RELEASE_TONE.WATCH,
    };
  }
  return {
    label: "Clear",
    detail: "All signals nominal",
    tone: RELEASE_TONE.CLEAR,
  };
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
