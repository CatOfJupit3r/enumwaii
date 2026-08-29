import {
  FILTER,
  FILTER_ACTION_CASES,
  filterReducer,
  type FilterState,
} from "./app";

const state: FilterState = { selected: FILTER.ALL };

// @ts-expect-error Component state accepts only values owned by this enumwaii.
const rawState: FilterState = { selected: "ACTIVE" };

filterReducer(state, {
  type: FILTER_ACTION_CASES.SELECT,
  // @ts-expect-error Reducer payloads preserve the same branded ownership.
  filter: "ACTIVE",
});

void rawState;
