import { Link, createFileRoute } from "@tanstack/solid-router";
import { For, createMemo } from "solid-js";

import {
  INCIDENT_STATE,
  describeIncidentState,
  summarizeSystemStatus,
  type SystemStatusSummary,
} from "~/domain/incidents";
import { getIncidentBoard } from "~/server/incidents.functions";

export const Route = createFileRoute("/")({
  loader: () => getIncidentBoard(),
  head: () => ({
    meta: [{ title: "Statuswaii · Service status" }],
  }),
  component: PublicStatusPage,
});

function PublicStatusPage() {
  const board = Route.useLoaderData();
  const status = createMemo(() => summarizeSystemStatus(board().incidents));
  const activeIncidents = createMemo(() =>
    board().incidents.filter(
      (incident) => incident.state !== INCIDENT_STATE.RESOLVED,
    ),
  );

  return (
    <main class="public-page">
      <section class="public-hero page-frame">
        <p class="eyebrow">Statuswaii / Live service health</p>
        <h1>Know what is working before you wonder.</h1>
        <p>
          Current availability and incident history for the services that power
          checkout, identity, and event delivery.
        </p>
      </section>

      <section
        aria-live="polite"
        class="system-banner page-frame"
        data-tone={status().tone}
      >
        <span class="system-banner__signal" aria-hidden="true" />
        <div>
          <p class="eyebrow">Current status</p>
          <h2>{status().label}</h2>
          <p>{status().detail}</p>
        </div>
        <span class="mono">{statusCode(status())}</span>
      </section>

      <div class="page-frame public-grid">
        <section aria-labelledby="active-status">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Now</p>
              <h2 id="active-status">Active incidents</h2>
            </div>
            <span class="queue-count mono">
              {activeIncidents().length} OPEN
            </span>
          </div>

          <div class="public-incident-list">
            <For
              each={activeIncidents()}
              fallback={
                <article class="operational-card">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <h3>All systems operational</h3>
                    <p>
                      No active incidents. Every monitored service is healthy.
                    </p>
                  </div>
                </article>
              }
            >
              {(incident) => {
                const presentation = describeIncidentState(incident.state);
                return (
                  <article
                    class="public-incident"
                    data-tone={presentation.tone}
                  >
                    <div class="public-incident__header">
                      <span class="state-pill" data-tone={presentation.tone}>
                        <span class="state-pill__dot" aria-hidden="true" />
                        {presentation.label}
                      </span>
                      <span class="mono">{incident.openedAt}</span>
                    </div>
                    <h3>{incident.title}</h3>
                    <p>{incident.impact}</p>
                    <footer>
                      <span>{incident.service}</span>
                      <span>Incident {incident.id}</span>
                    </footer>
                  </article>
                );
              }}
            </For>
          </div>
        </section>

        <aside class="history-panel">
          <p class="eyebrow">Incident history</p>
          <h2>Recent updates</h2>
          <ol class="history-timeline">
            <For each={board().incidents}>
              {(incident) => {
                const presentation = describeIncidentState(incident.state);
                return (
                  <li>
                    <span
                      class="history-timeline__dot"
                      data-tone={presentation.tone}
                    />
                    <div>
                      <strong>{incident.service}</strong>
                      <p>{incident.title}</p>
                      <small>
                        {presentation.label} · {incident.openedAt}
                      </small>
                    </div>
                  </li>
                );
              }}
            </For>
          </ol>
          <Link class="primary-link" search={{}} to="/ops">
            Open internal ops room <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </main>
  );
}

function statusCode(status: SystemStatusSummary): string {
  return status.state === null
    ? "OPERATIONAL"
    : describeIncidentState(status.state).shortLabel;
}
