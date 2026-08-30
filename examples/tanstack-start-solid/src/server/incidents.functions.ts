import { createServerFn } from "@tanstack/solid-start";

import { createIncidentStateInspection } from "~/domain/incident-inspection";
import {
  createIncidentInputSchema,
  incidentStateSchema,
  transitionIncidentInputSchema,
} from "~/domain/incidents";
import {
  createStoredIncident,
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

export const createIncident = createServerFn({ method: "POST" })
  .validator(createIncidentInputSchema)
  .handler(({ data }) => createStoredIncident(data));
