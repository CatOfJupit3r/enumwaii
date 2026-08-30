export class OrderNotFoundError extends Error {
  public constructor(public readonly orderId: string) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}

export class OrderVersionConflict extends Error {
  public constructor(
    public readonly orderId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Order ${orderId} is at version ${actualVersion}, not ${expectedVersion}`,
    );
    this.name = "OrderVersionConflict";
  }
}
