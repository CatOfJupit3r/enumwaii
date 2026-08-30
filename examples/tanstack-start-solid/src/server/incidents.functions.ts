import { createServerFn } from "@tanstack/solid-start";

import { createIncidentStateInspection } from "~/domain/incident-inspection";
import {
  incidentStateSchema,
  transitionIncidentInputSchema,
} from "~/domain/incidents";
import {
  listStoredIncidents,
  transitionStoredIncident,
} from "./incidents.server";

export const getIncidentBoard = createServerFn({ method: "GET" }).handler(
  () => ({
    incidents: listStoredIncidents(),
    loadedAt: new Date().toISOString(),
    release: "RC-42",
  }),
);

export const inspectIncidentState = createServerFn({ method: "GET" })
  .validator(incidentStateSchema)
  .handler(({ data }) =>
    createIncidentStateInspection(data, new Date().toISOString()),
  );

export const transitionIncident = createServerFn({ method: "POST" })
  .validator(transitionIncidentInputSchema)
  .handler(({ data }) => transitionStoredIncident(data));
