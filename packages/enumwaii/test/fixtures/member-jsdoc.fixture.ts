import { em } from "../../src/index";

const states = em({
  /**
   * Default state.
   *
   * Used when the user is not in a special condition.
   */
  NONE: "NONE",
  /**
   * Active state,
   * used while the user is participating.
   */
  ACTIVE: "ACTIVE",
});

export const none = states.enum.NONE;
export const active = states.enum.ACTIVE;
