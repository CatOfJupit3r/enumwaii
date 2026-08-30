import {
  INITIAL_INCIDENTS,
  transitionIncidentState,
  type CreateIncidentInput,
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

  public create(input: CreateIncidentInput): IncidentRecord {
    const created: IncidentRecord = {
      id: this.nextIncidentId(),
      service: input.service,
      title: input.title,
      owner: input.owner,
      openedAt: "just now",
      impact: input.impact,
      state: input.state,
      version: 0,
    };
    this.incidents = [created, ...this.incidents];

    return copyIncident(created);
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

  private nextIncidentId(): string {
    const highestNumber = this.incidents.reduce((highest, incident) => {
      const match = /^INC-(\d+)$/.exec(incident.id);
      if (match === null) return highest;

      const number = Number(match[1]);
      return Number.isSafeInteger(number) ? Math.max(highest, number) : highest;
    }, 0);

    return `INC-${String(highestNumber + 1).padStart(4, "0")}`;
  }
}

const incidentStore = new IncidentStore();

export function listStoredIncidents(): readonly IncidentRecord[] {
  return incidentStore.list();
}

export function createStoredIncident(
  input: CreateIncidentInput,
): IncidentRecord {
  return incidentStore.create(input);
}

export function transitionStoredIncident(
  input: TransitionIncidentInput,
): IncidentRecord {
  return incidentStore.transition(input);
}

function copyIncident(incident: IncidentRecord): IncidentRecord {
  return { ...incident };
}
