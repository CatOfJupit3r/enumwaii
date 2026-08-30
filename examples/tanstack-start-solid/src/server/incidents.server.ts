import {
  INITIAL_INCIDENTS,
  transitionIncidentState,
  type IncidentRecord,
  type TransitionIncidentInput,
} from "~/domain/incidents";

export class IncidentNotFoundError extends Error {
  public constructor(public readonly incidentId: string) {
    super(`Incident ${incidentId} was not found.`);
    this.name = "IncidentNotFoundError";
  }
}

export class IncidentVersionConflictError extends Error {
  public constructor(
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `This incident changed at version ${actualVersion}; refresh before retrying version ${expectedVersion}.`,
    );
    this.name = "IncidentVersionConflictError";
  }
}

export class IncidentStore {
  private incidents: IncidentRecord[];

  public constructor(seed: readonly IncidentRecord[] = INITIAL_INCIDENTS) {
    this.incidents = seed.map(copyIncident);
  }

  public list(): readonly IncidentRecord[] {
    return this.incidents.map(copyIncident);
  }

  public transition(input: TransitionIncidentInput): IncidentRecord {
    const currentIndex = this.incidents.findIndex(
      (incident) => incident.id === input.incidentId,
    );
    const current = this.incidents[currentIndex];

    if (current === undefined) {
      throw new IncidentNotFoundError(input.incidentId);
    }
    if (current.version !== input.expectedVersion) {
      throw new IncidentVersionConflictError(
        input.expectedVersion,
        current.version,
      );
    }

    const updated: IncidentRecord = {
      ...current,
      state: transitionIncidentState(current.state, input.to),
      version: current.version + 1,
    };
    this.incidents = this.incidents.map((incident, index) =>
      index === currentIndex ? updated : incident,
    );

    return copyIncident(updated);
  }
}

const incidentStore = new IncidentStore();

export function listStoredIncidents(): readonly IncidentRecord[] {
  return incidentStore.list();
}

export function transitionStoredIncident(
  input: TransitionIncidentInput,
): IncidentRecord {
  return incidentStore.transition(input);
}

function copyIncident(incident: IncidentRecord): IncidentRecord {
  return { ...incident };
}
