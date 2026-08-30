import { describe, expect, it } from "vitest";

import { app } from "./src/app";

function jsonThemeRequest(body: unknown) {
  return app.handle(
    new Request("http://localhost/v1/themes/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function get(path: string) {
  return app.handle(new Request(`http://localhost${path}`));
}

describe("Elysia theme plugin", () => {
  it("serves the responsive playground without starting a listener", async () => {
    const response = await get("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(html).toContain("Theme Boundary Console");
    expect(html).toContain("/v1/themes/selection");
  });

  it("validates a direct scalar Standard Schema body and uses derived metadata", async () => {
    const response = await jsonThemeRequest("DARK");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      theme: "DARK",
      label: "Dark theme",
      cssClass: "theme-dark",
      prefersDark: true,
    });
  });

  it("customizes Elysia's validation response for an unknown body string", async () => {
    const response = await jsonThemeRequest("HIGH_CONTRAST");

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_THEME_REQUEST",
      boundary: "body",
      message: 'Cannot parse "HIGH_CONTRAST"',
    });
  });

  it("rejects the wrong primitive type at the Standard Schema boundary", async () => {
    const response = await jsonThemeRequest(42);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_THEME_REQUEST",
      boundary: "body",
      message: "Cannot parse 42",
    });
  });

  it("extracts a scalar from object-shaped params before parsing it", async () => {
    const response = await get("/v1/themes/lookup/LIGHT");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      theme: "LIGHT",
      label: "Light theme",
      cssClass: "theme-light",
      prefersDark: false,
    });
  });

  it("maps a malformed path member through the plugin error lifecycle", async () => {
    const response = await get("/v1/themes/lookup/NEON");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_THEME_VALUE",
      boundary: "params.theme",
      message: "Invalid theme at params.theme",
    });
  });

  it("uses default only when the optional query value is missing", async () => {
    const response = await get("/v1/themes/preference");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      theme: "SYSTEM",
      label: "System theme",
      cssClass: "theme-system",
      prefersDark: false,
      resolution: "default",
    });
  });

  it("does not use default for a malformed query value", async () => {
    const response = await get("/v1/themes/preference?theme=NEON");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_THEME_VALUE",
      boundary: "query.theme",
      message: "Invalid theme at query.theme",
    });
  });

  it("uses fallback for the same malformed query value", async () => {
    const response = await get("/v1/themes/recommendation?theme=NEON");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      theme: "SYSTEM",
      label: "System theme",
      cssClass: "theme-system",
      prefersDark: false,
      resolution: "fallback",
    });
  });

  it("validates a branded domain value through a response Standard Schema", async () => {
    const response = await get("/v1/themes/current");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("DARK");
  });

  it("shows that Standard Schema validates the parsed value, not media type", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/themes/selection", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "DARK",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      theme: "DARK",
      cssClass: "theme-dark",
    });
  });
});
