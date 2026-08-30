import { describe, expect, it } from "vitest";

import { POST } from "../app/api/inspect/route";

function jsonRequest(body: string): Request {
  return new Request("https://example.test/api/inspect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/inspect", () => {
  it("parses a valid JSON status at the route boundary", async () => {
    const response = await POST(jsonRequest('{"status":"BLOCKED"}'));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      defaultOnly: { accepted: true, source: "request", status: "BLOCKED" },
      recovery: { accepted: true, source: "request", status: "BLOCKED" },
    });
  });

  it("distinguishes a missing property from malformed and wrong-type values", async () => {
    const missing = await POST(jsonRequest("{}"));
    const malformed = await POST(jsonRequest('{"status":"PAUSED"}'));
    const wrongType = await POST(jsonRequest('{"status":42}'));

    await expect(missing.json()).resolves.toMatchObject({
      defaultOnly: { source: "default" },
      recovery: { source: "default" },
    });
    await expect(malformed.json()).resolves.toMatchObject({
      defaultOnly: { source: "rejected" },
      recovery: { source: "fallback" },
    });
    await expect(wrongType.json()).resolves.toMatchObject({
      input: { kind: "wrong type" },
      defaultOnly: { source: "rejected" },
      recovery: { source: "fallback" },
    });
  });

  it("returns a structured 400 for malformed JSON and invalid envelopes", async () => {
    const malformedJson = await POST(jsonRequest("{"));
    const scalarBody = await POST(jsonRequest("42"));

    expect(malformedJson.status).toBe(400);
    await expect(malformedJson.json()).resolves.toMatchObject({
      error: { code: "INVALID_JSON" },
    });
    expect(scalarBody.status).toBe(400);
    await expect(scalarBody.json()).resolves.toMatchObject({
      error: { code: "INVALID_BODY" },
    });
  });
});
