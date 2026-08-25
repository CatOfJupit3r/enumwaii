import { EnumwaiiError } from "./enumwaii-error";

export class EnumwaiiUnknownMemberError extends EnumwaiiError {
  public constructor(public readonly member: string) {
    super(`Unknown member "${member}"`);
    this.name = "EnumwaiiUnknownMemberError";
  }
}
