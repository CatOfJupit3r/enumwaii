export class EnumwaiiError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "EnumwaiiError";
  }
}
