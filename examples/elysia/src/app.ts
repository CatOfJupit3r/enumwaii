import { node } from "@elysia/node";
import { Elysia } from "elysia";
import { parcels } from "./domain/parcel";
import { parcelPlugin } from "./http/parcel-plugin";
import { renderDashboard } from "./ui/dashboard";

const defaultParcel = parcels[0]!;

export const app = new Elysia({ adapter: node() })
  .get(
    "/",
    () =>
      new Response(renderDashboard(defaultParcel), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
  )
  .get("/track/:code", ({ params }) => {
    const parcel = parcels.find((candidate) => candidate.code === params.code);
    if (parcel === undefined) {
      return new Response(
        "<!doctype html><title>Tracking code not found · Waybill</title><main><h1>We could not find that tracking code</h1><p>Check the code on your shipping email and try again.</p></main>",
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }
    return new Response(renderDashboard(parcel), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  })
  .group("/api", (api) => api.use(parcelPlugin));
