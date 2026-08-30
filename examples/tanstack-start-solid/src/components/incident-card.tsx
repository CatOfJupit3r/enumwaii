import { For, Show } from "solid-js";

import {
  describeIncidentState,
  getAllowedIncidentTransitions,
  type IncidentRecord,
  type IncidentState,
} from "~/domain/incidents";

export interface IncidentCardProps {
  readonly incident: IncidentRecord;
  readonly focused: boolean;
  readonly busy: boolean;
  readonly onTransition: (incident: IncidentRecord, to: IncidentState) => void;
}

export function IncidentCard(props: IncidentCardProps) {
  const presentation = () => describeIncidentState(props.incident.state);
  const transitions = () => getAllowedIncidentTransitions(props.incident.state);

  return (
    <article
      class="incident-card"
      classList={{ "incident-card--focused": props.focused }}
      data-tone={presentation().tone}
    >
      <div class="incident-card__rail" aria-hidden="true" />
      <div class="incident-card__body">
        <div class="incident-card__heading">
          <div>
            <div class="incident-card__meta">
              <span class="mono">{props.incident.id}</span>
              <span class="meta-separator" aria-hidden="true">
                /
              </span>
              <span>{props.incident.service}</span>
            </div>
            <h3>{props.incident.title}</h3>
          </div>
          <span class="state-pill" data-tone={presentation().tone}>
            <span class="state-pill__dot" aria-hidden="true" />
            {presentation().label}
          </span>
        </div>

        <dl class="incident-facts">
          <div>
            <dt>Commander</dt>
            <dd>{props.incident.owner}</dd>
          </div>
          <div>
            <dt>Opened</dt>
            <dd>{props.incident.openedAt}</dd>
          </div>
          <div>
            <dt>Impact</dt>
            <dd>{props.incident.impact}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd class="mono">v{props.incident.version}</dd>
          </div>
        </dl>

        <div class="incident-card__footer">
          <p>{presentation().instruction}</p>
          <div class="transition-actions" aria-label="Allowed transitions">
            <Show
              when={transitions().length > 0}
              fallback={
                <span class="terminal-copy">No further transitions</span>
              }
            >
              <For each={transitions()}>
                {(nextState) => (
                  <button
                    class="transition-button"
                    disabled={props.busy}
                    onClick={() =>
                      props.onTransition(props.incident, nextState)
                    }
                    type="button"
                  >
                    {describeIncidentState(nextState).shortLabel}
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </article>
  );
}
