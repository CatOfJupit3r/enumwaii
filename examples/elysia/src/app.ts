import { node } from "@elysia/node";
import { Elysia } from "elysia";

import { themePlugin } from "./http/theme-plugin";
import { renderDashboard } from "./ui/dashboard";

export const app = new Elysia({ adapter: node() })
  .get(
    "/",
    () =>
      new Response(renderDashboard(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
  )
  .group("/v1", (api) => api.use(themePlugin));
