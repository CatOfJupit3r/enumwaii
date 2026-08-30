import { em } from "enumwaii";

import {
  DISPATCH_STAGE,
  nextDispatchStages,
  REPORT_PRIORITY,
  type DispatchStage,
  type NewFieldReport,
} from "./domain/dispatch";

function acceptsDispatchStage(stage: DispatchStage): DispatchStage {
  return stage;
}

acceptsDispatchStage(DISPATCH_STAGE.DISPATCHED);

// @ts-expect-error Raw external strings must cross the parser boundary.
acceptsDispatchStage("DISPATCHED");

const unrelatedStages = em(["DISPATCHED", "PAUSED"]);
const UNRELATED_STAGE = unrelatedStages.enum;

// @ts-expect-error A member from a differently shaped declaration is foreign.
acceptsDispatchStage(UNRELATED_STAGE.DISPATCHED);

const report = {
  summary: "Inspect west valve",
  notes: "Bring a pressure gauge",
  priority: REPORT_PRIORITY.IMPORTANT,
} satisfies NewFieldReport;

void report;
nextDispatchStages(DISPATCH_STAGE.ON_SITE);
