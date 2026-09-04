import { em } from "enumwaii";
import { sdkValues, tupleValues } from "./object-em-values";

em(sdkValues);
em(tupleValues);
function fromObject(values: Record<string, string>) {
  return em(values);
}
function fromArray(values: readonly [string, ...string[]]) {
  return em(values);
}
const awsStatus = em(sdkValues);
void [fromObject, fromArray, awsStatus];
