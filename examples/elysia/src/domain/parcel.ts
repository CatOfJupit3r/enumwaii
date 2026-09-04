import { uppercase } from "enumwaii/derive-with";
import { em, type InferEnumwaii } from "enumwaii";

const colors = em(["SLATE", "BLUE", "AMBER", "GREEN", "ROSE"]);
export const PARCEL_COLOR = colors.enum;

const parcelStatuses = em({
  CREATED: "created",
  IN_TRANSIT: "in-transit",
  OUT_FOR_DELIVERY: "out-for-delivery",
  DELIVERED: "delivered",
  RETURNED: "returned",
});
export const PARCEL_STATUS = parcelStatuses.enum;
export type ParcelStatus = InferEnumwaii<typeof parcelStatuses>;
export const parcelStatusSchema = parcelStatuses;

const couriers = em({
  EXPRESS: "express",
  STANDARD: "standard",
  CARGO: "cargo",
});
export const COURIER = couriers.enum;
export type Courier = InferEnumwaii<typeof couriers>;
export const courierSchema = couriers;

const statusDetails = parcelStatuses.derive(
  [
    PARCEL_STATUS.CREATED,
    { label: "Label created", color: PARCEL_COLOR.SLATE },
  ],
  [PARCEL_STATUS.IN_TRANSIT, { label: "In transit", color: PARCEL_COLOR.BLUE }],
  [
    PARCEL_STATUS.OUT_FOR_DELIVERY,
    { label: "Out for delivery", color: PARCEL_COLOR.AMBER },
  ],
  [PARCEL_STATUS.DELIVERED, { label: "Delivered", color: PARCEL_COLOR.GREEN }],
  [
    PARCEL_STATUS.RETURNED,
    { label: "Returning to sender", color: PARCEL_COLOR.ROSE },
  ],
);
const courierLabels = couriers.derive(uppercase);
export function courierLabel(courier: Courier): string {
  return courierLabels.get(courier);
}

export function describeParcelStatus(status: ParcelStatus) {
  return {
    status,
    slug: status,
    ...statusDetails.get(status),
  };
}

export type Checkpoint = {
  readonly at: string;
  readonly place: string;
  readonly note: string;
  readonly courier: Courier;
};
export type Parcel = {
  readonly code: string;
  readonly recipient: string;
  readonly route: string;
  readonly status: ParcelStatus;
  readonly courier: Courier;
  readonly checkpoints: readonly Checkpoint[];
};

export const parcels: readonly Parcel[] = [
  {
    code: "WB-48291",
    recipient: "Sofia Martins",
    route: "Rotterdam → Lisbon",
    status: PARCEL_STATUS.OUT_FOR_DELIVERY,
    courier: COURIER.EXPRESS,
    checkpoints: [
      {
        at: "09:12",
        place: "Lisbon depot",
        note: "Out with courier Ana",
        courier: COURIER.EXPRESS,
      },
      {
        at: "06:48",
        place: "Lisbon sorting hub",
        note: "Arrived from Rotterdam",
        courier: COURIER.EXPRESS,
      },
    ],
  },
  {
    code: "WB-48292",
    recipient: "Jonas Keller",
    route: "Berlin → Copenhagen",
    status: PARCEL_STATUS.IN_TRANSIT,
    courier: COURIER.STANDARD,
    checkpoints: [
      {
        at: "Yesterday",
        place: "Berlin hub",
        note: "Loaded for linehaul",
        courier: COURIER.STANDARD,
      },
    ],
  },
  {
    code: "WB-48293",
    recipient: "Marta Costa",
    route: "Porto → Madrid",
    status: PARCEL_STATUS.DELIVERED,
    courier: COURIER.CARGO,
    checkpoints: [
      {
        at: "Yesterday",
        place: "Madrid Centro",
        note: "Handed to recipient",
        courier: COURIER.CARGO,
      },
    ],
  },
];
