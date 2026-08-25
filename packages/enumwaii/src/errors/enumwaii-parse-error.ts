import { EnumwaiiError } from "./enumwaii-error";

export class EnumwaiiParseError extends EnumwaiiError {
  public constructor(public readonly received: unknown) {
    super(`Cannot parse ${JSON.stringify(received)}`);
    this.name = "EnumwaiiParseError";
  }
}
