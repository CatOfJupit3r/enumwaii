import { Elysia } from "elysia";

import { describeTheme, themeSchema } from "./src/domain/theme";

new Elysia().post(
  "/brand-bridge",
  ({ body }) => {
    // Elysia 1.4.30 maps the branded string through PrettifyIfObject.
    // @ts-expect-error The mapped handler value is not assignable to Theme.
    describeTheme(body);

    return describeTheme(themeSchema.parse(body));
  },
  { body: themeSchema },
);

new Elysia().get(
  "/invalid-output",
  // @ts-expect-error The Standard Schema response rejects an unknown member.
  () => "NEON",
  { response: themeSchema },
);

// @ts-expect-error Raw strings cannot enter branded domain logic.
describeTheme("DARK");
