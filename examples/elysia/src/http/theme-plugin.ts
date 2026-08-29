import { Elysia, t } from "elysia";

import {
  describeTheme,
  getCurrentTheme,
  THEME,
  themeSchema,
  type Theme,
} from "../domain/theme";

type ThemeBoundary = "params.theme" | "query.theme";
type ThemeResolution = "request" | "default" | "fallback";

class ThemeBoundaryError extends Error {
  public constructor(
    public readonly boundary: ThemeBoundary,
    public readonly received: unknown,
  ) {
    super(`Invalid theme at ${boundary}`);
    this.name = "ThemeBoundaryError";
  }
}

function requireTheme(input: unknown, boundary: ThemeBoundary): Theme {
  const result = themeSchema.safeParse(input);
  if (result.success) return result.value;
  throw new ThemeBoundaryError(boundary, input);
}

function resolveDefaultTheme(input: unknown): {
  theme: Theme;
  resolution: Exclude<ThemeResolution, "fallback">;
} {
  const result = themeSchema.safeParse(input, { default: THEME.SYSTEM });
  if (!result.success) throw new ThemeBoundaryError("query.theme", input);

  return {
    theme: result.value,
    resolution: input === null || input === undefined ? "default" : "request",
  };
}

function resolveFallbackTheme(input: unknown): {
  theme: Theme;
  resolution: Exclude<ThemeResolution, "default">;
} {
  const strictResult = themeSchema.safeParse(input);
  if (strictResult.success)
    return { theme: strictResult.value, resolution: "request" };

  return {
    theme: themeSchema.parse(input, { fallback: THEME.SYSTEM }),
    resolution: "fallback",
  };
}

function describeResolvedTheme(theme: Theme, resolution: ThemeResolution) {
  return { ...describeTheme(theme), resolution };
}

const optionalThemeQuery = t.Object({
  theme: t.Optional(t.String()),
});

export const themePlugin = new Elysia({ name: "enumwaii-theme-plugin" })
  .error({ THEME_BOUNDARY: ThemeBoundaryError })
  .onError(({ code, error, status }) => {
    if (code === "VALIDATION") {
      const issue = error.all[0];
      const responseStatus = error.type === "response" ? 500 : 422;

      return status(responseStatus, {
        error:
          error.type === "response"
            ? "INVALID_THEME_RESPONSE"
            : "INVALID_THEME_REQUEST",
        boundary: error.type,
        message: issue?.message ?? "Theme validation failed",
      });
    }

    if (code === "THEME_BOUNDARY") {
      return status(400, {
        error: "INVALID_THEME_VALUE",
        boundary: error.boundary,
        message: error.message,
      });
    }
  })
  .group("/themes", (themes) =>
    themes
      .post(
        "/selection",
        ({ body }) => {
          // Elysia validated this value already. In 1.4.30 its handler-context
          // mapping erases the usable branded primitive type, so parse restores
          // the brand without an assertion before domain code receives it.
          return describeTheme(themeSchema.parse(body));
        },
        { body: themeSchema },
      )
      .get(
        "/preference",
        ({ query }) => {
          const resolved = resolveDefaultTheme(query.theme);
          return describeResolvedTheme(resolved.theme, resolved.resolution);
        },
        { query: optionalThemeQuery },
      )
      .get(
        "/recommendation",
        ({ query }) => {
          const resolved = resolveFallbackTheme(query.theme);
          return describeResolvedTheme(resolved.theme, resolved.resolution);
        },
        { query: optionalThemeQuery },
      )
      .get("/current", () => getCurrentTheme(), { response: themeSchema })
      .get(
        "/lookup/:theme",
        ({ params }) =>
          describeTheme(requireTheme(params.theme, "params.theme")),
        { params: t.Object({ theme: t.String() }) },
      ),
  );
