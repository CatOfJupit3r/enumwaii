import { describe, expect, it } from "vitest";
import { app } from "./src/app";

function get(path: string) {
  return app.handle(new Request(`http://localhost${path}`));
}
function scan(code: string, body: unknown) {
  return app.handle(
    new Request(`http://localhost/api/parcels/${code}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("Waybill parcel tracking", () => {
  it("renders a public tracking page with a checkpoint timeline", async () => {
    const response = await get("/track/WB-48291");
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("Rotterdam → Lisbon");
  });
  it("returns an honest tracking-page 404 for an unknown code", async () => {
    const response = await get("/track/WB-00000");
    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toContain("Tracking code not found");
  });
  it("uses an object-form enum for parcel couriers and derived status metadata", async () => {
    const response = await get("/api/status/out-for-delivery");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "out-for-delivery",
      slug: "out-for-delivery",
      label: "Out for delivery",
    });
  });
  it("uses a nil-only default for a missing parcel status filter", async () => {
    const response = await get("/api/parcels");
    await expect(response.json()).resolves.toMatchObject({
      status: "created",
      resolution: "DEFAULT",
    });
  });
  it("rejects malformed status query members rather than defaulting them", async () => {
    const response = await get("/api/parcels?status=LOST");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_PARCEL_VALUE",
      boundary: "query.status",
    });
  });
  it("falls legacy scanner firmware back to STANDARD for an unknown courier", async () => {
    const response = await get("/api/parcels/estimate?courier=old-scanner");
    await expect(response.json()).resolves.toMatchObject({
      courier: "standard",
      resolution: "FALLBACK",
    });
  });
  it("validates a Valibot scan-event body that includes enumwaii's courier adapter", async () => {
    const response = await scan("WB-48291", {
      checkpoint: "Accepted at depot",
      place: "Lisbon depot",
      courier: "express",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      accepted: true,
      scan: { courier: "express" },
    });
  });
  it("rejects invalid Valibot scan payloads", async () => {
    const response = await scan("WB-48291", {
      checkpoint: "x",
      place: "L",
      courier: "teleport",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_PARCEL_VALUE",
      boundary: "body",
    });
  });
});

it("accepts kebab-case filters and rejects code keys and underscore spellings", async () => {
  const valid = await get("/api/parcels?status=out-for-delivery");
  expect(valid.status).toBe(200);
  await expect(valid.json()).resolves.toMatchObject({
    parcels: [{ status: "out-for-delivery" }],
    resolution: "REQUEST",
  });
  for (const status of ["OUT_FOR_DELIVERY", "out_for_delivery"]) {
    expect((await get("/api/status/" + status)).status).toBe(400);
  }
});
