import { For } from "solid-js";

import {
  countIncidentsInState,
  describeIncidentState,
  listIncidentStates,
  type IncidentRecord,
  type IncidentState,
} from "~/domain/incidents";

export interface StateTrackProps {
  readonly incidents: readonly IncidentRecord[];
  readonly focusedState: IncidentState;
}

export function StateTrack(props: StateTrackProps) {
  return (
    <ol class="state-track" aria-label="Incident lifecycle">
      <For each={listIncidentStates()}>
        {(state) => {
          const presentation = describeIncidentState(state);
          const count = () => countIncidentsInState(props.incidents, state);

          return (
            <li
              class="state-track__item"
              classList={{
                "state-track__item--focused": state === props.focusedState,
              }}
              data-tone={presentation.tone}
            >
              <div class="state-track__marker">
                <span>{presentation.sequence}</span>
              </div>
              <div class="state-track__copy">
                <div>
                  <strong>{presentation.label}</strong>
                  <span class="state-track__count">{count()}</span>
                </div>
                <p>{presentation.summary}</p>
              </div>
            </li>
          );
        }}
      </For>
    </ol>
  );
}
