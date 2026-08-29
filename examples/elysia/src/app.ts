import { Elysia } from "elysia";

import { themePlugin } from "./http/theme-plugin";

export const app = new Elysia().group("/v1", (api) => api.use(themePlugin));
