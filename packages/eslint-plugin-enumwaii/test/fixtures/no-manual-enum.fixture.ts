import { em } from "enumwaii";

const states = em(["LOADING", "SUCCESS", "ERROR"]);
const STATE = states.cases;
type RequestState =
  | { state: typeof STATE.LOADING }
  | { state: typeof STATE.SUCCESS; data: string }
  | { state: typeof STATE.ERROR; error: Error };

// Compiled by test:types: canonical tags preserve narrowing and exhaustiveness.
export function describeState(value: RequestState): string {
  switch (value.state) {
    case STATE.LOADING:
      return "Loading";
    case STATE.SUCCESS:
      return value.data;
    case STATE.ERROR:
      return value.error.message;
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}
