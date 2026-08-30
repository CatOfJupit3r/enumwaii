import { em } from "enumwaii";

const labEvents = em(["START", "SUCCEED", "FAIL"]);

/** Native cases are used only to discriminate and narrow reducer events. */
export const LAB_EVENT_CASE = labEvents.cases;
