import { Elysia, t } from "elysia";
import * as v from "valibot";
import { valibotSchema } from "enumwaii/valibot";
import { em, type InferEnumwaii } from "enumwaii";

import {
  COURIER,
  courierSchema,
  describeParcelStatus,
  PARCEL_STATUS,
  parcels,
  parcelStatusSchema,
  type Courier,
  type ParcelStatus,
} from "../domain/parcel";

const resolutions = em(["REQUEST", "DEFAULT", "FALLBACK"]);
const RESOLUTION = resolutions.enum;
type Resolution = InferEnumwaii<typeof resolutions>;

class ParcelBoundaryError extends Error {
  public constructor(
    public readonly boundary: string,
    public readonly received: unknown,
  ) {
    super(`Invalid parcel value at ${boundary}`);
    this.name = "ParcelBoundaryError";
  }
}
const scanEventSchema = v.object({
  checkpoint: v.pipe(v.string(), v.minLength(2)),
  place: v.pipe(v.string(), v.minLength(2)),
  courier: valibotSchema(courierSchema),
});

function requireStatus(input: unknown, boundary: string): ParcelStatus {
  const result = parcelStatusSchema.safeParse(input);
  if (!result.success) throw new ParcelBoundaryError(boundary, input);
  return result.value;
}
function resolveStatus(input: unknown) {
  const result = parcelStatusSchema.safeParse(input, {
    default: PARCEL_STATUS.CREATED,
  });
  if (!result.success) throw new ParcelBoundaryError("query.status", input);
  return {
    status: result.value,
    resolution: input === undefined ? RESOLUTION.DEFAULT : RESOLUTION.REQUEST,
  } as const;
}
function resolveCourier(input: unknown): {
  courier: Courier;
  resolution: Resolution;
} {
  const strict = courierSchema.safeParse(input);
  return strict.success
    ? { courier: strict.value, resolution: RESOLUTION.REQUEST }
    : {
        courier: courierSchema.parse(input, { fallback: COURIER.STANDARD }),
        resolution: RESOLUTION.FALLBACK,
      };
}

export const parcelPlugin = new Elysia({ name: "waybill-parcel-plugin" })
  .error({ PARCEL_BOUNDARY: ParcelBoundaryError })
  .onError(({ code, error, status }) => {
    if (code === "PARCEL_BOUNDARY")
      return status(400, {
        error: "INVALID_PARCEL_VALUE",
        boundary: error.boundary,
        message: error.message,
      });
    if (code === "VALIDATION")
      return status(422, {
        error: "INVALID_SCAN_EVENT",
        message: error.all[0]?.message ?? "Scan event validation failed",
      });
  })
  .get(
    "/parcels",
    ({ query }) => {
      const resolved = resolveStatus(query.status);
      return {
        parcels:
          query.status === undefined
            ? parcels
            : parcels.filter((parcel) => parcel.status === resolved.status),
        ...resolved,
      };
    },
    { query: t.Object({ status: t.Optional(t.String()) }) },
  )
  .get(
    "/parcels/estimate",
    ({ query }) => {
      const resolved = resolveCourier(query.courier);
      return {
        courier: resolved.courier,
        resolution: resolved.resolution,
        estimate:
          resolved.courier === COURIER.EXPRESS ? "Today, 18:00" : "Tomorrow",
      };
    },
    { query: t.Object({ courier: t.Optional(t.String()) }) },
  )
  .post(
    "/parcels/:code/scan",
    ({ params, body }) => {
      const parsed = v.safeParse(scanEventSchema, body);
      if (!parsed.success) throw new ParcelBoundaryError("body", body);
      const parcel = parcels.find(
        (candidate) => candidate.code === params.code,
      );
      if (parcel === undefined)
        return new Response(JSON.stringify({ error: "PARCEL_NOT_FOUND" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      return { parcel: parcel.code, accepted: true, scan: parsed.output };
    },
    { params: t.Object({ code: t.String() }), body: t.Unknown() },
  )
  .get(
    "/parcels/:code",
    ({ params }) => {
      const parcel = parcels.find(
        (candidate) => candidate.code === params.code,
      );
      return parcel === undefined
        ? new Response(JSON.stringify({ error: "PARCEL_NOT_FOUND" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        : parcel;
    },
    { params: t.Object({ code: t.String() }) },
  )
  .get(
    "/status/:status",
    ({ params }) =>
      describeParcelStatus(requireStatus(params.status, "params.status")),
    { params: t.Object({ status: t.String() }) },
  );
