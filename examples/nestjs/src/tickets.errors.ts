export class TicketNotFoundError extends Error {
  public constructor(public readonly ticketId: string) {
    super(`Ticket ${ticketId} was not found`);
    this.name = "TicketNotFoundError";
  }
}

export class TicketVersionConflict extends Error {
  public constructor(
    public readonly ticketId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Ticket ${ticketId} is at version ${actualVersion}, not ${expectedVersion}`,
    );
    this.name = "TicketVersionConflict";
  }
}
