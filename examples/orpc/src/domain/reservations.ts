import { em, type InferEnumwaii } from "enumwaii";

export const reservationServices = em(["LUNCH", "DINNER"]);
export const RESERVATION_SERVICE = reservationServices.enum;
export type ReservationService = InferEnumwaii<typeof reservationServices>;

export const reservationStatuses = em([
  "REQUESTED",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);
export const RESERVATION_STATUS = reservationStatuses.enum;
export type ReservationStatus = InferEnumwaii<typeof reservationStatuses>;

const allowedTransitions = reservationStatuses.deriveTo(
  reservationStatuses,
  [
    RESERVATION_STATUS.REQUESTED,
    [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CANCELLED],
  ],
  [
    RESERVATION_STATUS.CONFIRMED,
    [
      RESERVATION_STATUS.SEATED,
      RESERVATION_STATUS.NO_SHOW,
      RESERVATION_STATUS.CANCELLED,
    ],
  ],
  [RESERVATION_STATUS.SEATED, [RESERVATION_STATUS.COMPLETED]],
  [RESERVATION_STATUS.COMPLETED, []],
  [RESERVATION_STATUS.NO_SHOW, []],
  [RESERVATION_STATUS.CANCELLED, []],
);

export interface ReservationRecord {
  readonly id: string;
  readonly owner: string;
  readonly service: ReservationService;
  readonly partySize: number;
  readonly status: ReservationStatus;
  readonly version: number;
}
export interface ReservationSummary extends ReservationRecord {
  readonly availableTransitions: ReservationStatus[];
}

export class ReservationNotFoundError extends Error {
  public constructor(public readonly reservationId: string) {
    super('Reservation "' + reservationId + '" was not found');
    this.name = "ReservationNotFoundError";
  }
}
export class ReservationVersionConflictError extends Error {
  public constructor(
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super("This reservation was updated by another host");
    this.name = "ReservationVersionConflictError";
  }
}
export class DoubleBookedError extends Error {
  public constructor(
    public readonly reservationId: string,
    public readonly owner: string,
    public readonly service: ReservationService,
  ) {
    super(owner + " already has a " + service.toLowerCase() + " reservation");
    this.name = "DoubleBookedError";
  }
}
export class IllegalReservationTransitionError extends Error {
  public constructor(
    public readonly from: ReservationStatus,
    public readonly to: ReservationStatus,
  ) {
    super("Cannot transition a reservation from " + from + " to " + to);
    this.name = "IllegalReservationTransitionError";
  }
}

export function availableReservationTransitions(
  from: ReservationStatus,
): ReservationStatus[] {
  const targets = allowedTransitions.get(from);
  return typeof targets === "string" ? [targets] : [...targets];
}
export function transitionReservationStatus(
  from: ReservationStatus,
  to: ReservationStatus,
): ReservationStatus {
  if (!availableReservationTransitions(from).includes(to))
    throw new IllegalReservationTransitionError(from, to);
  return to;
}
function seededReservations(): ReservationRecord[] {
  return [
    {
      id: "res-olive",
      owner: "Lina & Mateo",
      service: RESERVATION_SERVICE.DINNER,
      partySize: 2,
      status: RESERVATION_STATUS.CONFIRMED,
      version: 0,
    },
    {
      id: "res-harbor",
      owner: "Ada Okafor",
      service: RESERVATION_SERVICE.LUNCH,
      partySize: 4,
      status: RESERVATION_STATUS.REQUESTED,
      version: 3,
    },
    {
      id: "res-copper",
      owner: "Jun Park",
      service: RESERVATION_SERVICE.DINNER,
      partySize: 6,
      status: RESERVATION_STATUS.SEATED,
      version: 6,
    },
  ];
}
export class ReservationStore {
  private readonly records = new Map<string, ReservationRecord>();
  public constructor() {
    this.reset();
  }
  public list(): ReservationSummary[] {
    return [...this.records.values()].map((record) => ({
      ...record,
      availableTransitions: availableReservationTransitions(record.status),
    }));
  }
  public find(reservationId: string): ReservationRecord {
    const record = this.records.get(reservationId);
    if (record === undefined) throw new ReservationNotFoundError(reservationId);
    return record;
  }
  public request(
    owner: string,
    partySize: number,
    service: ReservationService,
  ): ReservationSummary {
    const alreadyBooked = [...this.records.values()].find(
      (reservation) =>
        reservation.owner.toLowerCase() === owner.toLowerCase() &&
        reservation.service === service &&
        reservation.status !== RESERVATION_STATUS.CANCELLED,
    );
    if (alreadyBooked !== undefined) {
      throw new DoubleBookedError(alreadyBooked.id, owner, service);
    }
    const id = "res-" + (this.records.size + 100);
    const record: ReservationRecord = {
      id,
      owner,
      partySize,
      service,
      status: RESERVATION_STATUS.REQUESTED,
      version: 0,
    };
    this.records.set(id, record);
    return {
      ...record,
      availableTransitions: availableReservationTransitions(record.status),
    };
  }
  public transition(
    reservationId: string,
    to: ReservationStatus,
    expectedVersion: number,
  ): ReservationRecord {
    const record = this.find(reservationId);
    if (expectedVersion !== record.version)
      throw new ReservationVersionConflictError(
        expectedVersion,
        record.version,
      );
    const updated = {
      ...record,
      status: transitionReservationStatus(record.status, to),
      version: record.version + 1,
    };
    this.records.set(reservationId, updated);
    return updated;
  }
  public reset(): ReservationSummary[] {
    this.records.clear();
    for (const record of seededReservations())
      this.records.set(record.id, record);
    return this.list();
  }
}
